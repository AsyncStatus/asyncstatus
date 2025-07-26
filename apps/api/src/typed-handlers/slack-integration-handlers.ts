import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { WebClient } from "@slack/web-api";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContext, TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteSlackIntegrationContract,
  getSlackIntegrationContract,
  listSlackChannelsContract,
  listSlackUsersContract,
  slackIntegrationCallbackContract,
} from "./slack-integration-contracts";

export const slackIntegrationCallbackHandler = typedHandler<
  TypedHandlersContext,
  typeof slackIntegrationCallbackContract
>(slackIntegrationCallbackContract, async ({ redirect, webAppUrl, db, input, slack, workflow }) => {
  const { code, state: organizationSlug } = input;

  if (!code || !organizationSlug) {
    return redirect(
      `${webAppUrl}/error?error-title=${encodeURIComponent("Missing required parameters")}&error-description=${encodeURIComponent("Missing required parameters.")}`,
    );
  }

  try {
    const organization = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, organizationSlug),
    });

    if (!organization) {
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Organization not found")}&error-description=${encodeURIComponent("Organization not found.")}`,
      );
    }

    const slackClient = new WebClient();
    const response = await slackClient.oauth.v2.access({
      client_id: slack.clientId,
      client_secret: slack.clientSecret,
      code,
    });

    if (!response.ok || !response.access_token || !response.team?.id) {
      return redirect(
        `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("Slack integration error")}&error-description=${encodeURIComponent("Failed to exchange code for access token.")}`,
      );
    }

    if (response.is_enterprise_install) {
      return redirect(
        `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("Slack integration error")}&error-description=${encodeURIComponent("Enterprise installations are not supported.")}`,
      );
    }

    const result = await db.transaction(async (tx) => {
      const now = new Date();

      const team = response.team!;

      const existingIntegration = await tx
        .select()
        .from(schema.slackIntegration)
        .where(eq(schema.slackIntegration.organizationId, organization.id))
        .limit(1);

      let integrationId: string | undefined;

      if (existingIntegration[0]) {
        await tx
          .update(schema.slackIntegration)
          .set({
            teamId: team.id,
            teamName: team.name,
            enterpriseId: response.enterprise?.id,
            enterpriseName: response.enterprise?.name,
            botAccessToken: response.access_token,
            botScopes: response.scope,
            botUserId: response.bot_user_id,
            appId: response.app_id,
            tokenExpiresAt: response.expires_in
              ? new Date(Date.now() + response.expires_in * 1000)
              : null,
            refreshToken: response.refresh_token,
            updatedAt: now,
          })
          .where(eq(schema.slackIntegration.id, existingIntegration[0].id));

        integrationId = existingIntegration[0].id;
      } else {
        const newIntegration = await tx
          .insert(schema.slackIntegration)
          .values({
            id: generateId(),
            organizationId: organization.id,
            teamId: team.id,
            teamName: team.name,
            enterpriseId: response.enterprise?.id,
            enterpriseName: response.enterprise?.name,
            botAccessToken: response.access_token,
            botScopes: response.scope,
            botUserId: response.bot_user_id,
            appId: response.app_id,
            tokenExpiresAt: response.expires_in
              ? new Date(Date.now() + response.expires_in * 1000)
              : null,
            refreshToken: response.refresh_token,
            createdAt: now,
            updatedAt: now,
          } as any)
          .returning();

        integrationId = newIntegration[0]?.id;
      }

      if (!integrationId) {
        throw new Error("Failed to create Slack integration");
      }

      // Store user token if user granted additional scopes
      if (response.authed_user?.access_token && response.authed_user?.id) {
        // Check if user already exists
        const existingUser = await tx
          .select()
          .from(schema.slackUser)
          .where(eq(schema.slackUser.slackUserId, response.authed_user.id))
          .limit(1);

        if (existingUser[0]) {
          // Update existing user
          await tx
            .update(schema.slackUser)
            .set({
              integrationId: integrationId,
              accessToken: response.authed_user.access_token,
              scopes: response.authed_user.scope || null,
              tokenExpiresAt: response.authed_user.expires_in
                ? new Date(Date.now() + response.authed_user.expires_in * 1000)
                : null,
              refreshToken: response.authed_user.refresh_token || null,
              updatedAt: now,
            })
            .where(eq(schema.slackUser.id, existingUser[0].id));
        } else {
          // Create new user
          await tx.insert(schema.slackUser).values({
            id: generateId(),
            integrationId: integrationId,
            slackUserId: response.authed_user.id,
            accessToken: response.authed_user.access_token,
            scopes: response.authed_user.scope || null,
            tokenExpiresAt: response.authed_user.expires_in
              ? new Date(Date.now() + response.authed_user.expires_in * 1000)
              : null,
            refreshToken: response.authed_user.refresh_token || null,
            isInstaller: true,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      return { integrationId };
    });

    const workflowInstance = await workflow.syncSlack.create({
      params: { integrationId: result.integrationId },
    });

    await db
      .update(schema.slackIntegration)
      .set({ syncId: workflowInstance.id })
      .where(eq(schema.slackIntegration.id, result.integrationId));

    return redirect(`${webAppUrl}/${organization.slug}/integrations`);
  } catch (error) {
    console.error(error);
    return redirect(
      `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("Slack integration error")}&error-description=${encodeURIComponent("Failed to complete Slack integration. Please try again.")}`,
    );
  }
});

export const getSlackIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getSlackIntegrationContract
>(
  getSlackIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.slackIntegration.findFirst({
      where: eq(schema.slackIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return null;
    }

    return integration;
  },
);

export const listSlackChannelsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listSlackChannelsContract
>(
  listSlackChannelsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.slackIntegration.findFirst({
      where: eq(schema.slackIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return [];
    }

    const channels = await db.query.slackChannel.findMany({
      where: eq(schema.slackChannel.integrationId, integration.id),
    });

    return channels;
  },
);

export const listSlackUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listSlackUsersContract
>(listSlackUsersContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.slackIntegration.findFirst({
    where: eq(schema.slackIntegration.organizationId, organization.id),
  });
  if (!integration) {
    return [];
  }

  const users = await db.query.slackUser.findMany({
    where: eq(schema.slackUser.integrationId, integration.id),
  });

  return users;
});

export const deleteSlackIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteSlackIntegrationContract
>(
  deleteSlackIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, workflow, member }) => {
    if (member.role !== "admin" && member.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to disconnect GitHub",
      });
    }

    const integration = await db.query.slackIntegration.findFirst({
      where: eq(schema.slackIntegration.organizationId, organization.id),
    });
    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Slack integration not found",
      });
    }

    if (integration.deleteId) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "Slack integration is already being deleted",
      });
    }

    const workflowInstance = await workflow.deleteSlackIntegration.create({
      params: { integrationId: integration.id },
    });
    await db
      .update(schema.slackIntegration)
      .set({ deleteId: workflowInstance.id })
      .where(eq(schema.slackIntegration.id, integration.id));

    return { success: true };
  },
);
