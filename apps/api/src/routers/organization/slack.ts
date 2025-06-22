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
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import { zOrganizationIdOrSlug } from "../../schema/organization";

export const slackIntegrationRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredOrganization)
  .use(requiredSession)
  .get(
    "/:idOrSlug/slack/integration",
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      // Check if user is admin or owner
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to view Slack integration",
        });
      }

      const integration = await c.var.db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.organizationId, c.var.organization.id),
      });

      if (!integration) {
        throw new AsyncStatusNotFoundError({
          message: "Slack integration not found",
        });
      }

      return c.json(integration);
    }
  )
  .delete(
    "/:idOrSlug/slack/integration",
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      // Check if user is admin or owner
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to disconnect Slack integration",
        });
      }

      const integration = await c.var.db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.organizationId, c.var.organization.id),
      });

      if (!integration) {
        throw new AsyncStatusNotFoundError({
          message: "Slack integration not found",
        });
      }

      // Delete the integration
      await c.var.db
        .delete(schema.slackIntegration)
        .where(eq(schema.slackIntegration.id, integration.id));

      // Also clear any member's slack usernames
      await c.var.db
        .update(schema.member)
        .set({ slackUsername: null })
        .where(eq(schema.member.organizationId, c.var.organization.id));

      return c.json({ success: true });
    }
  );

// OAuth callback handler - this will be in the main slack router
export const slackOAuthRouter = new Hono<HonoEnvWithOrganization>()
  .get("/oauth/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state"); // organizationSlug
    const error = c.req.query("error");

    if (error) {
      return c.redirect(`${c.env.WEB_APP_URL}/${state}/settings/slack?error=${error}`);
    }

    if (!code || !state) {
      return c.redirect(`${c.env.WEB_APP_URL}/${state}/settings/slack?error=missing_code`);
    }

    try {
      // Exchange code for access token
      const response = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: c.env.SLACK_CLIENT_ID || "",
          client_secret: c.env.SLACK_CLIENT_SECRET || "",
          code,
          redirect_uri: `${c.env.WEB_APP_URL}/api/slack/oauth/callback`,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error("Slack OAuth error:", data);
        return c.redirect(`${c.env.WEB_APP_URL}/${state}/settings/slack?error=oauth_failed`);
      }

      // Find the organization by slug
      const organization = await c.var.db.query.organization.findFirst({
        where: eq(schema.organization.slug, state),
      });

      if (!organization) {
        return c.redirect(`${c.env.WEB_APP_URL}/${state}/settings/slack?error=org_not_found`);
      }

      // Check if integration already exists
      const existingIntegration = await c.var.db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.organizationId, organization.id),
      });

      if (existingIntegration) {
        // Update existing integration
        await c.var.db
          .update(schema.slackIntegration)
          .set({
            teamId: data.team.id,
            teamName: data.team.name,
            botUserId: data.bot_user_id,
            botAccessToken: data.access_token,
            installerUserId: data.authed_user.id,
            scope: data.scope,
            updatedAt: new Date(),
          })
          .where(eq(schema.slackIntegration.id, existingIntegration.id));
      } else {
        // Create new integration
        await c.var.db.insert(schema.slackIntegration).values({
          id: generateId(),
          organizationId: organization.id,
          teamId: data.team.id,
          teamName: data.team.name,
          botUserId: data.bot_user_id,
          botAccessToken: data.access_token,
          installerUserId: data.authed_user.id,
          scope: data.scope,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return c.redirect(`${c.env.WEB_APP_URL}/${state}/settings/slack?success=true`);
    } catch (error) {
      console.error("Slack OAuth callback error:", error);
      return c.redirect(`${c.env.WEB_APP_URL}/${state}/settings/slack?error=unexpected`);
    }
  });