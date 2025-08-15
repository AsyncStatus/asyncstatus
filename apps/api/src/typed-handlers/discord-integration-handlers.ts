import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { generateId } from "better-auth";
import { and, desc, eq, inArray } from "drizzle-orm";
import * as schema from "../db";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import {
  deleteDiscordIntegrationContract,
  discordIntegrationCallbackContract,
  fetchDiscordMessagesContract,
  getDiscordIntegrationContract,
  listDiscordChannelsContract,
  listDiscordServersContract,
  listDiscordUsersContract,
} from "./discord-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const discordIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof discordIntegrationCallbackContract
>(
  discordIntegrationCallbackContract,
  requiredSession,
  async ({ redirect, webAppUrl, db, input, session, workflow, discord, betterAuthUrl }) => {
    console.log(input);

    try {
      const { redirect: redirectUrl } = input;
      const account = await db.query.account.findFirst({
        where: and(
          eq(schema.account.userId, session.user.id),
          eq(schema.account.providerId, "discord"),
        ),
      });
      if (!account || !account.accessToken) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Account not found or not linked to Discord",
        });
      }

      const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bearer ${account.accessToken}` },
      });
      if (!userResponse.ok) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "Failed to get Discord user info",
        });
      }
      const userData = (await userResponse.json()) as { id: string };
      const discordUserId = userData.id;

      const organizations = await db
        .select({ organization: schema.organization, member: schema.member })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (organizations[0]?.organization.slug) {
        const existing = await db.query.discordIntegration.findFirst({
          where: eq(schema.discordIntegration.organizationId, organizations[0].organization.id),
        });
        if (existing) {
          return redirect(
            `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
          );
        }

        // Find a guild the user belongs to where our bot is installed
        const guildsResp = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: { Authorization: `Bearer ${account.accessToken}` },
        });
        if (!guildsResp.ok) {
          throw new TypedHandlersError({
            code: "UNAUTHORIZED",
            message: "Failed to list Discord guilds",
          });
        }
        const guilds = (await guildsResp.json()) as Array<{ id: string; name?: string }>;
        let installedGuild: { id: string; name?: string } | undefined;
        for (const g of guilds) {
          const gResp = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
            headers: { Authorization: `Bot ${discord.botToken}` },
          });
          if (gResp.ok) {
            installedGuild = g;
            break;
          }
        }

        if (!installedGuild) {
          return redirect(
            `https://discord.com/oauth2/authorize?client_id=${discord.clientId}&permissions=8&scope=bot+identify+email+guilds+guilds.members.read+messages.read&response_type=code&redirect_uri=${encodeURIComponent(
              `${betterAuthUrl}/integrations/discord/callback`,
            )}&state=${organizations[0].organization.slug}`,
          );
        }

        // Optional: fetch bot user
        const botMeResp = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bot ${discord.botToken}` },
        });
        const botMe = botMeResp.ok ? ((await botMeResp.json()) as { id?: string }) : null;

        const [newDiscordIntegration] = await db
          .insert(schema.discordIntegration)
          .values({
            id: generateId(),
            organizationId: organizations[0].organization.id,
            guildId: installedGuild.id,
            guildName: installedGuild.name || null,
            botAccessToken: discord.botToken,
            botScopes: account.scope || null,
            botUserId: botMe?.id || null,
            applicationId: discord.appId,
            tokenExpiresAt: null,
            refreshToken: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        if (!newDiscordIntegration) {
          return redirect(
            `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create Discord integration")}&error-description=${encodeURIComponent("Failed to create Discord integration. Please try again.")}`,
          );
        }

        await db
          .update(schema.member)
          .set({ discordId: discordUserId })
          .where(
            and(
              eq(schema.member.organizationId, organizations[0].organization.id),
              eq(schema.member.userId, session.user.id),
            ),
          );

        const workflowInstance = await workflow.syncDiscord.create({
          params: { integrationId: newDiscordIntegration.id },
        });

        await db
          .update(schema.discordIntegration)
          .set({ syncId: workflowInstance.id })
          .where(eq(schema.discordIntegration.id, newDiscordIntegration.id));

        return redirect(
          `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      const results = await db.transaction(async (tx) => {
        const now = dayjs();
        const name = `${session.user.name}'s Org`;
        const [newOrganization] = await tx
          .insert(schema.organization)
          .values({
            id: generateId(),
            name,
            slug: `${slugify(name)}-${generateId(4)}`,
            metadata: null,
            stripeCustomerId: null,
            trialPlan: "basic",
            trialStartDate: now.toDate(),
            trialEndDate: now.add(14, "day").toDate(),
            trialStatus: "active",
            createdAt: now.toDate(),
          })
          .returning();

        if (!newOrganization) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create organization",
          });
        }

        const [newMember] = await tx
          .insert(schema.member)
          .values({
            id: generateId(),
            organizationId: newOrganization.id,
            userId: session.user.id,
            role: "owner",
            createdAt: now.toDate(),
            discordId: discordUserId,
          })
          .returning();
        if (!newMember) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create member",
          });
        }

        await tx
          .update(schema.user)
          .set({
            activeOrganizationSlug: newOrganization.slug,
            showOnboarding: true,
            onboardingStep: "first-step",
            onboardingCompletedAt: null,
          })
          .where(eq(schema.user.id, session.user.id));

        return { organization: newOrganization, member: newMember };
      });

      const existing = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.organizationId, results.organization.id),
      });
      if (existing) {
        return redirect(
          `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      // Find a guild the user belongs to where our bot is installed
      const guildsResp = await fetch("https://discord.com/api/v10/users/@me/guilds", {
        headers: { Authorization: `Bearer ${account.accessToken}` },
      });
      if (!guildsResp.ok) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "Failed to list Discord guilds",
        });
      }
      const guilds = (await guildsResp.json()) as Array<{ id: string; name?: string }>;
      let installedGuild: { id: string; name?: string } | undefined;
      for (const g of guilds) {
        const gResp = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
          headers: { Authorization: `Bot ${discord.botToken}` },
        });
        if (gResp.ok) {
          installedGuild = g;
          break;
        }
      }

      if (!installedGuild) {
        return redirect(
          `https://discord.com/oauth2/authorize?client_id=${discord.clientId}&permissions=8&scope=bot+identify+email+guilds+guilds.members.read+messages.read&response_type=code&redirect_uri=${encodeURIComponent(
            `${betterAuthUrl}/integrations/discord/callback`,
          )}&state=${results.organization.slug}`,
        );
      }

      const botMeResp = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${discord.botToken}` },
      });
      const botMe = botMeResp.ok ? ((await botMeResp.json()) as { id?: string }) : null;

      const [newDiscordIntegration] = await db
        .insert(schema.discordIntegration)
        .values({
          id: generateId(),
          organizationId: results.organization.id,
          guildId: installedGuild.id,
          guildName: installedGuild.name || null,
          botAccessToken: discord.botToken,
          botScopes: account.scope || null,
          botUserId: botMe?.id || null,
          applicationId: discord.appId,
          tokenExpiresAt: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      if (!newDiscordIntegration) {
        return redirect(
          `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create Discord integration")}&error-description=${encodeURIComponent("Failed to create Discord integration. Please try again.")}`,
        );
      }

      const workflowInstance = await workflow.syncDiscord.create({
        params: { integrationId: newDiscordIntegration.id },
      });

      await db
        .update(schema.discordIntegration)
        .set({ syncId: workflowInstance.id })
        .where(eq(schema.discordIntegration.id, newDiscordIntegration.id));

      return redirect(
        `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    } catch (error) {
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : "Failed to complete Discord integration";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Discord integration")}&error-description=${encodeURIComponent(
          message,
        )}`,
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
