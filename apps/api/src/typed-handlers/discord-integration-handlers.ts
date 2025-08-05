import { typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq, inArray } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContext, TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  owner_id: string;
  member_count?: number;
  premium_tier: number;
  preferred_locale: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  locale?: string;
  verified?: boolean;
  mfa_enabled?: boolean;
  premium_type?: number;
}

import {
  deleteDiscordIntegrationContract,
  discordIntegrationCallbackContract,
  fetchDiscordMessagesContract,
  getDiscordIntegrationContract,
  listDiscordChannelsContract,
  listDiscordServersContract,
  listDiscordUsersContract,
} from "./discord-integration-contracts";

export const discordIntegrationCallbackHandler = typedHandler<
  TypedHandlersContext,
  typeof discordIntegrationCallbackContract
>(
  discordIntegrationCallbackContract,
  async ({ redirect, webAppUrl, betterAuthUrl, db, input, discord, workflow }) => {
    const { code, state: organizationSlug, guild_id: guildId, permissions } = input;

    if (!code || !organizationSlug || !guildId || !permissions) {
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Missing parameters")}&error-description=${encodeURIComponent("Missing required parameters.")}`,
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

      // Exchange code for access token using Discord OAuth2
      const tokenResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: discord.clientId,
          client_secret: discord.clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: `${betterAuthUrl}/integrations/discord/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("Discord OAuth error:", error);
        return redirect(
          `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("Discord integration error")}&error-description=${encodeURIComponent("Failed to exchange code for access token.")}`,
        );
      }

      const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;
      const { refresh_token, expires_in, scope } = tokenData;

      // Get guild information
      const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: {
          Authorization: `Bot ${discord.botToken}`,
        },
      });

      if (!guildResponse.ok) {
        return redirect(
          `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("Discord integration error")}&error-description=${encodeURIComponent("Failed to fetch guild information.")}`,
        );
      }

      const guildData = (await guildResponse.json()) as DiscordGuild;

      // Get bot user information
      const botResponse = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${discord.botToken}`,
        },
      });

      const botData = botResponse.ok ? ((await botResponse.json()) as DiscordUser) : null;

      const result = await db.transaction(async (tx) => {
        const now = new Date();

        // Check if integration already exists
        const existingIntegration = await tx
          .select()
          .from(schema.discordIntegration)
          .where(eq(schema.discordIntegration.guildId, guildId))
          .limit(1);

        let integrationId: string;

        if (existingIntegration[0]) {
          // Update existing integration
          await tx
            .update(schema.discordIntegration)
            .set({
              guildName: guildData.name,
              botAccessToken: discord.botToken, // We use the bot token from env
              botScopes: scope,
              botUserId: botData?.id || null,
              applicationId: discord.appId,
              tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
              refreshToken: refresh_token || null,
              updatedAt: now,
            })
            .where(eq(schema.discordIntegration.id, existingIntegration[0].id));

          integrationId = existingIntegration[0].id;
        } else {
          // Create new integration
          const newIntegration = await tx
            .insert(schema.discordIntegration)
            .values({
              id: generateId(),
              organizationId: organization.id,
              guildId,
              guildName: guildData.name,
              botAccessToken: discord.botToken,
              botScopes: scope,
              botUserId: botData?.id || null,
              applicationId: discord.appId,
              tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
              refreshToken: refresh_token || null,
              createdAt: now,
              updatedAt: now,
            })
            .returning();

          integrationId = newIntegration[0]?.id || "";
        }

        if (!integrationId) {
          throw new Error("Failed to create Discord integration");
        }

        // Generate a Durable Object ID for Discord Gateway
        const gatewayDurableObjectId = crypto.randomUUID();

        // Update the integration with the Durable Object ID
        await tx
          .update(schema.discordIntegration)
          .set({ gatewayDurableObjectId })
          .where(eq(schema.discordIntegration.id, integrationId));

        // Store the guild/server information
        await tx
          .insert(schema.discordServer)
          .values({
            id: generateId(),
            integrationId,
            guildId,
            name: guildData.name,
            icon: guildData.icon,
            description: guildData.description,
            ownerId: guildData.owner_id,
            memberCount: guildData.member_count,
            premiumTier: guildData.premium_tier,
            preferredLocale: guildData.preferred_locale,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: schema.discordServer.guildId,
            set: {
              name: guildData.name,
              icon: guildData.icon,
              description: guildData.description,
              ownerId: guildData.owner_id,
              memberCount: guildData.member_count,
              premiumTier: guildData.premium_tier,
              preferredLocale: guildData.preferred_locale,
              updatedAt: now,
            },
          });

        return { integrationId };
      });

      // Trigger sync workflow
      const workflowInstance = await workflow.syncDiscord.create({
        params: { integrationId: result.integrationId },
      });

      await db
        .update(schema.discordIntegration)
        .set({ syncId: workflowInstance.id })
        .where(eq(schema.discordIntegration.id, result.integrationId));

      return redirect(`${webAppUrl}/${organization.slug}/integrations`);
    } catch (error) {
      console.error("Discord integration error:", error);
      return redirect(
        `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("Discord integration error")}&error-description=${encodeURIComponent("An unexpected error occurred.")}`,
      );
    }
  },
);

export const getDiscordIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getDiscordIntegrationContract
>(
  getDiscordIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return null;
    }

    return integration;
  },
);

export const listDiscordServersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listDiscordServersContract
>(
  listDiscordServersContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return [];
    }

    const servers = await db.query.discordServer.findMany({
      where: eq(schema.discordServer.integrationId, integration.id),
    });

    return servers;
  },
);

export const listDiscordChannelsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listDiscordChannelsContract
>(
  listDiscordChannelsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return [];
    }

    // Get all servers with their channels for this integration
    const servers = await db.query.discordServer.findMany({
      where: eq(schema.discordServer.integrationId, integration.id),
      with: {
        channels: true,
      },
    });

    // Flatten all channels from all servers
    const channels = servers.flatMap((server) => server.channels);

    return channels;
  },
);

export const listDiscordUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listDiscordUsersContract
>(listDiscordUsersContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.discordIntegration.findFirst({
    where: eq(schema.discordIntegration.organizationId, organization.id),
  });
  if (!integration) {
    return [];
  }

  const users = await db.query.discordUser.findMany({
    where: eq(schema.discordUser.integrationId, integration.id),
  });

  return users;
});

export const deleteDiscordIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteDiscordIntegrationContract
>(
  deleteDiscordIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, workflow }) => {
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
    });

    if (!integration) {
      return { success: false };
    }

    // Trigger delete workflow
    const workflowInstance = await workflow.deleteDiscordIntegration.create({
      params: { integrationId: integration.id },
    });

    await db
      .update(schema.discordIntegration)
      .set({ deleteId: workflowInstance.id })
      .where(eq(schema.discordIntegration.id, integration.id));

    return { success: true };
  },
);

export const fetchDiscordMessagesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof fetchDiscordMessagesContract
>(
  fetchDiscordMessagesContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, workflow }) => {
    const { channelId, limit = 50, before, after } = input;

    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.organizationId, organization.id),
      with: {
        servers: {
          with: {
            channels: true,
          },
        },
      },
    });

    if (!integration) {
      return { success: false };
    }

    // If channelId is specified, validate it belongs to this integration
    if (channelId) {
      const hasChannel = integration.servers.some((server) =>
        server.channels.some((channel) => channel.channelId === channelId),
      );

      if (!hasChannel) {
        return { success: false };
      }
    }

    // Automatically determine 'after' parameter from the most recent message
    let finalAfter = after;
    if (!after) {
      const serverIds = integration.servers.map((server) => server.id);

      if (serverIds.length > 0) {
        const lastEvent = await db.query.discordEvent.findFirst({
          where: and(
            eq(schema.discordEvent.type, "MESSAGE_CREATE"),
            inArray(schema.discordEvent.serverId, serverIds),
          ),
          orderBy: desc(schema.discordEvent.createdAt),
        });

        finalAfter = lastEvent?.messageId || undefined;
      }
    }

    // Trigger message fetch workflow
    const workflowInstance = await workflow.fetchDiscordMessages.create({
      params: {
        integrationId: integration.id,
        channelId,
        limit,
        before,
        after: finalAfter,
      },
    });

    return {
      success: true,
      workflowId: workflowInstance.id,
    };
  },
);
