import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

import * as schema from "../../db/schema";
import {
  AsyncStatusForbiddenError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import {
  zGithubIntegrationCreate,
  zGithubIntegrationUpdate,
} from "../../schema/github-integration";
import { zOrganizationIdOrSlug } from "../../schema/organization";

export const githubRouter = new Hono<HonoEnvWithOrganization>()
  // Add GitHub callback handler as a route
  .get("/callback/github", async (c) => {
    // Get installation_id from query parameters
    const installationId = c.req.query("installation_id");
    const organizationId = c.req.query("state"); // we'll use state to store org ID

    if (!installationId || !organizationId) {
      return c.redirect(
        `${c.env.WEB_APP_URL}/error?message=Missing required parameters`,
      );
    }

    try {
      // Create DB instance
      const db = c.var.db;

      // Find organization
      const organization = await db
        .select()
        .from(schema.organization)
        .where(eq(schema.organization.id, organizationId))
        .limit(1);

      if (!organization[0]) {
        return c.redirect(
          `${c.env.WEB_APP_URL}/error?message=Organization not found`,
        );
      }

      // Check if integration already exists
      const existingIntegration = await db
        .select()
        .from(schema.githubIntegration)
        .where(eq(schema.githubIntegration.organizationId, organizationId))
        .limit(1);

      if (existingIntegration[0]) {
        // Update existing integration
        await db
          .update(schema.githubIntegration)
          .set({
            installationId,
            updatedAt: new Date(),
          })
          .where(eq(schema.githubIntegration.id, existingIntegration[0].id));
      } else {
        // Create new integration
        await db.insert(schema.githubIntegration).values({
          id: generateId(),
          organizationId,
          installationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Redirect back to organization settings
      return c.redirect(
        `${c.env.WEB_APP_URL}/${organization[0].slug}/settings?tab=integrations`,
      );
    } catch (error) {
      console.error("GitHub callback error:", error);
      return c.redirect(
        `${c.env.WEB_APP_URL}/error?message=Failed to connect GitHub`,
      );
    }
  })
  .post(
    "/:idOrSlug/github",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("json", zGithubIntegrationCreate),
    async (c) => {
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to connect GitHub",
        });
      }

      const { installationId } = c.req.valid("json");

      // Check if integration already exists
      const existingIntegration = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);

      if (existingIntegration[0]) {
        // Update existing integration
        const updatedIntegration = await c.var.db
          .update(schema.githubIntegration)
          .set({
            installationId,
            updatedAt: new Date(),
          })
          .where(eq(schema.githubIntegration.id, existingIntegration[0].id))
          .returning();

        return c.json(updatedIntegration[0]);
      }

      // Create new integration
      const newIntegration = await c.var.db
        .insert(schema.githubIntegration)
        .values({
          id: nanoid(),
          organizationId: c.var.organization.id,
          installationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newIntegration || !newIntegration[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to connect GitHub",
        });
      }

      return c.json(newIntegration[0]);
    },
  )
  .get(
    "/:idOrSlug/github",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const integration = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);

      if (integration.length === 0) {
        return c.json(null);
      }

      return c.json(integration[0]);
    },
  )
  .delete(
    "/:idOrSlug/github",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to disconnect GitHub",
        });
      }

      await c.var.db
        .delete(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        );

      return c.json({ success: true });
    },
  )
  .patch(
    "/:idOrSlug/github",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("json", zGithubIntegrationUpdate),
    async (c) => {
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to update GitHub integration",
        });
      }

      const updates = c.req.valid("json");

      const updatedIntegration = await c.var.db
        .update(schema.githubIntegration)
        .set({
          ...updates,
          tokenExpiresAt: updates.tokenExpiresAt
            ? new Date(updates.tokenExpiresAt)
            : null,
          updatedAt: new Date(),
        })
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .returning();

      if (!updatedIntegration || !updatedIntegration[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update GitHub integration",
        });
      }

      return c.json(updatedIntegration[0]);
    },
  );
