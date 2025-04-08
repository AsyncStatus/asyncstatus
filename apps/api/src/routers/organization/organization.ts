import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import * as schema from "../../db/schema";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import {
  zOrganizationCreate,
  zOrganizationIdOrSlug,
  zOrganizationUpdate,
} from "../../schema/organization";

export const organizationRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredSession)
  .post("/", zValidator("form", zOrganizationCreate), async (c) => {
    const { name, slug, logo } = c.req.valid("form");

    // Check if organization with the same slug already exists
    const existingOrganization = await c.var.db.query.organization.findFirst({
      where: eq(schema.organization.slug, slug),
    });

    if (existingOrganization) {
      throw new AsyncStatusBadRequestError({
        message: "Organization with this slug already exists",
      });
    }

    const organizationId = generateId();
    let logoKey = null;

    if (logo instanceof File) {
      const image = await c.env.PRIVATE_BUCKET.put(generateId(), logo);
      if (!image) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to upload image",
        });
      }
      logoKey = image.key;
    }

    const now = new Date();

    // Use a transaction to ensure all operations are atomic
    const results = await c.var.db.transaction(async (tx) => {
      // Create the organization
      const organization = await tx
        .insert(schema.organization)
        .values({
          id: organizationId,
          name,
          slug,
          logo: logoKey,
          createdAt: now,
        })
        .returning();

      if (!organization || !organization[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create organization",
        });
      }

      // Create the owner member record
      const member = await tx
        .insert(schema.member)
        .values({
          id: generateId(),
          organizationId,
          userId: c.var.session.user.id,
          role: "owner",
          createdAt: now,
        })
        .returning();

      if (!member || !member[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create member",
        });
      }

      // Create a default team for the organization
      const teamId = generateId();
      const team = await tx
        .insert(schema.team)
        .values({
          id: teamId,
          name: `${name}'s Team`,
          organizationId,
          createdAt: now,
        })
        .returning();

      if (!team || !team[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create default team",
        });
      }

      // Add the member to the team
      const teamMembership = await tx
        .insert(schema.teamMembership)
        .values({
          id: generateId(),
          teamId,
          memberId: member[0].id,
        })
        .returning();

      if (!teamMembership || !teamMembership[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create team membership",
        });
      }

      return {
        organization: organization[0],
        member: member[0],
        team: team[0],
        teamMembership: teamMembership[0],
      };
    });

    return c.json(results);
  })
  .get(
    "/:idOrSlug",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      return c.json(c.var.organization);
    },
  )
  .patch(
    "/:idOrSlug",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("form", zOrganizationUpdate),
    async (c) => {
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to update organization settings",
        });
      }

      const updates = c.req.valid("form");

      if (updates.logo instanceof File) {
        const image = await c.env.PRIVATE_BUCKET.put(
          generateId(),
          updates.logo,
        );
        if (!image) {
          throw new AsyncStatusUnexpectedApiError({
            message: "Failed to upload image",
          });
        }
        (updates as any).logo = image.key;
      } else if (updates.logo === null && c.var.organization.logo) {
        await c.env.PRIVATE_BUCKET.delete(c.var.organization.logo);
        (updates as any).logo = null;
      }

      const updatedOrganization = await c.var.db
        .update(schema.organization)
        .set(updates as any)
        .where(eq(schema.organization.id, c.var.organization.id))
        .returning();
      if (!updatedOrganization) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update organization",
        });
      }

      return c.json(updatedOrganization);
    },
  )
  .get(
    "/:idOrSlug/file",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("query", z.object({ fileKey: z.string() })),
    async (c) => {
      const { fileKey } = c.req.valid("query");
      const object = await c.env.PRIVATE_BUCKET.get(fileKey);
      if (!object) {
        throw new AsyncStatusNotFoundError({ message: "File not found" });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "private, max-age=600");

      return new Response(object.body, { headers });
    },
  );
