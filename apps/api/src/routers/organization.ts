import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { and, eq, not } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import * as schema from "../db/schema";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../errors";
import type { HonoEnvWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "../lib/middleware";
import {
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
  zOrganizationMemberId,
  zOrganizationMemberUpdate,
} from "../schema/organization";

export const organizationRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredSession)
  .get(
    "/:idOrSlug",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      return c.json(c.var.organization);
    },
  )
  .get(
    "/:idOrSlug/members",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const [membersWithUsers, invitations] = await Promise.all([
        c.var.db.query.member.findMany({
          where: eq(schema.member.organizationId, c.var.organization.id),
          with: { user: true },
        }),
        c.var.db.query.invitation.findMany({
          where: and(
            eq(schema.invitation.organizationId, c.var.organization.id),
            not(eq(schema.invitation.status, "accepted")),
            not(eq(schema.invitation.status, "canceled")),
          ),
        }),
      ]);
      return c.json({ members: membersWithUsers, invitations });
    },
  )
  .get(
    "/:idOrSlug/members/:memberId",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug.and(zOrganizationMemberId)),
    async (c) => {
      const { memberId } = c.req.valid("param");

      const member = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.organizationId, c.var.organization.id),
          eq(schema.member.id, memberId),
        ),
        with: { user: true, team: true },
      });
      if (!member) {
        throw new AsyncStatusNotFoundError({ message: "Member not found" });
      }

      return c.json(member);
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
  )
  .patch(
    "/:idOrSlug/members/:memberId",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug.and(zOrganizationMemberId)),
    zValidator("form", zOrganizationMemberUpdate),
    async (c) => {
      const { memberId } = c.req.valid("param");
      const hasPermissionResponse = await c.var.auth.api.hasPermission({
        body: {
          permission: { member: ["update"] },
          organizationId: c.var.organization.id,
        },
        headers: c.req.raw.headers,
      });
      if (!hasPermissionResponse.success && memberId !== c.var.member.id) {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to update members",
        });
      }
      const member = await c.var.db.query.member.findFirst({
        where: eq(schema.member.id, memberId),
        with: { user: true },
      });
      if (!member) {
        throw new AsyncStatusNotFoundError({ message: "Member not found" });
      }

      const { role, ...userUpdates } = c.req.valid("form");
      if (role) {
        await c.var.auth.api.updateMemberRole({
          body: { memberId, role, organizationId: c.var.organization.id },
          headers: c.req.raw.headers,
        });
      }
      if (userUpdates.image instanceof File) {
        const image = await c.env.PRIVATE_BUCKET.put(
          generateId(),
          userUpdates.image,
        );
        if (!image) {
          throw new AsyncStatusUnexpectedApiError({
            message: "Failed to upload image",
          });
        }
        (userUpdates.image as any) = image.key;
      } else if (userUpdates.image === null && member.user.image) {
        await c.env.PRIVATE_BUCKET.delete(member.user.image);
        (userUpdates.image as any) = null;
      }
      if (Object.keys(userUpdates).length > 0) {
        const name =
          userUpdates.firstName || userUpdates.lastName
            ? `${userUpdates.firstName} ${userUpdates.lastName}`
            : undefined;

        await c.var.db
          .update(schema.user)
          .set({ name, ...(userUpdates as any) })
          .where(eq(schema.user.id, member.userId));
      }
      const updatedMember = await c.var.db.query.member.findFirst({
        where: eq(schema.member.id, memberId),
        with: { user: true },
      });
      if (!updatedMember) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update member",
        });
      }

      return c.json(updatedMember);
    },
  )
  .post(
    "/:idOrSlug/members/invitations",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("json", zOrganizationCreateInvite),
    async (c) => {
      const { firstName, lastName, email, role } = c.req.valid("json");
      const hasPermissionResponse = await c.var.auth.api.hasPermission({
        body: {
          permission: { invitation: ["create"] },
          organizationId: c.var.organization.id,
        },
        headers: c.req.raw.headers,
      });
      if (!hasPermissionResponse.success) {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to create invitations",
        });
      }

      let [existingInvitation, existingUser] = await Promise.all([
        c.var.db.query.invitation.findFirst({
          where: and(
            eq(schema.invitation.organizationId, c.var.organization.id),
            eq(schema.invitation.email, email),
          ),
        }),
        c.var.db.query.member.findFirst({
          where: and(
            eq(schema.member.organizationId, c.var.organization.id),
            eq(
              schema.member.userId,
              c.var.db
                .select({ id: schema.user.id })
                .from(schema.user)
                .where(eq(schema.user.email, email)),
            ),
          ),
          with: { user: true },
        }),
      ]);
      if (
        (existingInvitation?.expiresAt &&
          existingInvitation.expiresAt < new Date()) ||
        existingInvitation?.status === "canceled" ||
        existingInvitation?.status === "rejected"
      ) {
        await c.var.db
          .delete(schema.invitation)
          .where(eq(schema.invitation.id, existingInvitation.id));
        existingInvitation = undefined;
        existingUser = undefined;
      }
      if (existingInvitation || existingUser?.user) {
        throw new AsyncStatusBadRequestError({
          message: "User already a member or has an invitation",
        });
      }

      const newInvitation = await c.var.auth.api.createInvitation({
        body: {
          role,
          email,
          organizationId: c.var.organization.id,
        },
        headers: c.req.raw.headers,
      });
      await c.var.db
        .update(schema.invitation)
        .set({ name: `${firstName} ${lastName}` })
        .where(eq(schema.invitation.id, newInvitation.id));
      const updatedInvitation = await c.var.db.query.invitation.findFirst({
        where: eq(schema.invitation.id, newInvitation.id),
        with: {
          inviter: { columns: { id: true, name: true, email: true } },
          organization: { columns: { id: true, slug: true, name: true } },
        },
      });
      if (!updatedInvitation) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create invitation",
        });
      }

      return c.json(updatedInvitation);
    },
  );
