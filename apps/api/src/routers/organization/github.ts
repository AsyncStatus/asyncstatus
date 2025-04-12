import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../../db/schema";
import {
  AsyncStatusForbiddenError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import { wait } from "../../lib/wait";
import { zGithubIntegrationUpdate } from "../../schema/github-integration";
import { zOrganizationIdOrSlug } from "../../schema/organization";

export const githubRouter = new Hono<HonoEnvWithOrganization>()
  .get("/callback/github", async (c) => {
    const installationId = c.req.query("installation_id");
    const organizationSlug = c.req.query("state");

    if (!installationId || !organizationSlug) {
      return c.redirect(
        `${c.env.WEB_APP_URL}/error?message=Missing required parameters`,
      );
    }

    const db = c.var.db;
    try {
      const organization = await db.query.organization.findFirst({
        where: eq(schema.organization.slug, organizationSlug),
      });
      if (!organization) {
        return c.redirect(
          `${c.env.WEB_APP_URL}/error?message=Organization not found`,
        );
      }

      const existingIntegration = await db
        .select()
        .from(schema.githubIntegration)
        .where(eq(schema.githubIntegration.organizationId, organization.id))
        .limit(1);

      let integrationId;

      if (existingIntegration[0]) {
        await db
          .update(schema.githubIntegration)
          .set({
            installationId,
            updatedAt: new Date(),
          })
          .where(eq(schema.githubIntegration.id, existingIntegration[0].id))
          .returning();

        integrationId = existingIntegration[0].id;
      } else {
        const newIntegration = await db
          .insert(schema.githubIntegration)
          .values({
            id: generateId(),
            organizationId: organization.id,
            installationId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        integrationId = newIntegration[0]?.id;
      }
      if (!integrationId) {
        return c.redirect(
          `${c.env.WEB_APP_URL}/error?message=Failed to create GitHub integration`,
        );
      }

      const workflowInstance = await c.env.SYNC_GITHUB_WORKFLOW.create({
        params: { integrationId },
      });
      await db
        .update(schema.githubIntegration)
        .set({
          syncId: workflowInstance.id,
          syncStatus: (await workflowInstance.status()).status,
        })
        .where(eq(schema.githubIntegration.id, integrationId));

      return c.redirect(
        `${c.env.WEB_APP_URL}/${organization.slug}/settings?tab=integrations`,
      );
    } catch (error) {
      console.error("GitHub callback error:", error);
      return c.redirect(
        `${c.env.WEB_APP_URL}/error?message=Failed to connect GitHub: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  })
  .get(
    "/:idOrSlug/github/sync-status",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const [integration] = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);
      if (!integration || !integration.syncId) {
        return c.json({ status: "completed" });
      }

      const encoder = new TextEncoder();
      const transformStream = new TransformStream();
      const writer = transformStream.writable.getWriter();
      const headers = new Headers();
      headers.set("Content-Type", "text/event-stream");
      headers.set("Cache-Control", "no-cache");
      headers.set("Connection", "keep-alive");

      const workflowInstance = await c.env.SYNC_GITHUB_WORKFLOW.get(
        integration.syncId,
      );
      let statusInstance = await workflowInstance.status();
      const maxWaitTime = 1000 * 60 * 5; // 5 minutes
      const startTime = Date.now();

      while (
        statusInstance.status !== "complete" &&
        Date.now() - startTime < maxWaitTime
      ) {
        await wait(1000);
        statusInstance = await workflowInstance.status();
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(statusInstance)}\n\n`),
        );
      }

      statusInstance = await workflowInstance.status();
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(statusInstance)}\n\n`),
      );
      await writer.close();
      return new Response(transformStream.readable, { headers });
    },
  )
  .get(
    "/:idOrSlug/github/delete-status",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const [integration] = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);
      if (!integration || !integration.deleteId) {
        return c.json({ status: "completed" });
      }

      const encoder = new TextEncoder();
      const transformStream = new TransformStream();
      const writer = transformStream.writable.getWriter();
      const headers = new Headers();
      headers.set("Content-Type", "text/event-stream");
      headers.set("Cache-Control", "no-cache");
      headers.set("Connection", "keep-alive");

      const workflowInstance =
        await c.env.DELETE_GITHUB_INTEGRATION_WORKFLOW.get(
          integration.deleteId,
        );
      let statusInstance = await workflowInstance.status();
      const maxWaitTime = 1000 * 60 * 5; // 5 minutes
      const startTime = Date.now();

      while (
        statusInstance.status !== "complete" &&
        Date.now() - startTime < maxWaitTime
      ) {
        await wait(1000);
        statusInstance = await workflowInstance.status();
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(statusInstance)}\n\n`),
        );
      }

      statusInstance = await workflowInstance.status();
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(statusInstance)}\n\n`),
      );
      await writer.close();
      return new Response(transformStream.readable, { headers });
    },
  )
  .get(
    "/:idOrSlug/github",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const [integration] = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);

      if (!integration) {
        return c.json(null);
      }

      return c.json(integration);
    },
  )
  .get(
    "/:idOrSlug/github/repositories",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      // First, get the integration
      const [integration] = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);
      if (!integration) {
        return c.json([]);
      }

      const repositories = await c.var.db
        .select()
        .from(schema.githubRepository)
        .where(eq(schema.githubRepository.integrationId, integration.id));

      return c.json(repositories);
    },
  )
  .get(
    "/:idOrSlug/github/users",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      // First, get the integration
      const [integration] = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);

      if (!integration) {
        return c.json([]);
      }

      const users = await c.var.db
        .select()
        .from(schema.githubUser)
        .where(eq(schema.githubUser.integrationId, integration.id));

      return c.json(users);
    },
  )
  .delete(
    "/:idOrSlug/github",
    requiredSession,
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to disconnect GitHub",
        });
      }

      const [integration] = await c.var.db
        .select()
        .from(schema.githubIntegration)
        .where(
          eq(schema.githubIntegration.organizationId, c.var.organization.id),
        )
        .limit(1);
      if (!integration) {
        throw new AsyncStatusUnexpectedApiError({
          message: "GitHub integration not found",
        });
      }

      const workflowInstance =
        await c.env.DELETE_GITHUB_INTEGRATION_WORKFLOW.create({
          params: { integrationId: integration.id },
        });
      const statusInstance = await workflowInstance.status();
      await c.var.db
        .update(schema.githubIntegration)
        .set({
          deleteId: workflowInstance.id,
          deleteStatus: statusInstance.status,
        })
        .where(eq(schema.githubIntegration.id, integration.id));

      return c.json(statusInstance);
    },
  );
