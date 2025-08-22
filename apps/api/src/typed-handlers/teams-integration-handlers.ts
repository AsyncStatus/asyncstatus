import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "../db";
import type {
  TypedHandlersContext,
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteTeamsIntegrationContract,
  getTeamsIntegrationContract,
  listTeamsChannelsContract,
  listTeamsUsersContract,
  refreshTeamsTokenContract,
  syncTeamsIntegrationContract,
  teamsAddIntegrationCallbackContract,
  teamsIntegrationCallbackContract,
} from "./teams-integration-contracts";

export const teamsIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof teamsIntegrationCallbackContract
>(
  teamsIntegrationCallbackContract,
  async ({ redirect, webAppUrl, db, input, session, betterAuthUrl }) => {
    if (!session) {
      return redirect(webAppUrl);
    }

    try {
      const { redirect: redirectUrl } = input;
      const account = await db.query.account.findFirst({
        where: and(
          eq(schema.account.userId, session?.user.id),
          eq(schema.account.providerId, "teams"),
        ),
      });
      if (!account || !account.accessToken) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Account not found or not linked to Teams",
        });
      }

      const [org] = await db
        .select({
          organization: schema.organization,
          member: schema.member,
          teamsIntegration: schema.teamsIntegration,
        })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .leftJoin(
          schema.teamsIntegration,
          eq(schema.teamsIntegration.organizationId, schema.organization.id),
        )
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (!org?.organization.slug) {
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

        const teamsIntegration = await db.query.teamsIntegration.findFirst({
          where: eq(schema.teamsIntegration.organizationId, results.organization.id),
        });
        if (!teamsIntegration || teamsIntegration.syncError) {
          return redirect(
            getTeamsIntegrationConnectUrl({
              clientId: process.env.TEAMS_CLIENT_ID!,
              redirectUri: `${betterAuthUrl}${teamsAddIntegrationCallbackContract.url()}`,
              organizationSlug: results.organization.slug,
            }),
          );
        }

        return redirect(
          `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      if (org?.organization.slug && !org.teamsIntegration) {
        return redirect(
          getTeamsIntegrationConnectUrl({
            clientId: process.env.TEAMS_CLIENT_ID!,
            redirectUri: `${betterAuthUrl}${teamsAddIntegrationCallbackContract.url()}`,
            organizationSlug: org.organization.slug,
          }),
        );
      }

      if (org?.organization.slug && org.teamsIntegration) {
        return redirect(
          `${webAppUrl}/${org.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      return redirect(webAppUrl);
    } catch (error) {
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to complete Teams integration. Please try again.";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Teams integration")}&error-description=${encodeURIComponent(
          `${message}. Please try again.`,
        )}`,
      );
    }
  },
);

export const teamsAddIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof teamsAddIntegrationCallbackContract
>(
  teamsAddIntegrationCallbackContract,
  async ({ redirect, webAppUrl, db, input, workflow, betterAuthUrl, session }) => {
    try {
      const { code, state: organizationSlug, error, error_description } = input;
      
      if (error) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: error_description || error,
        });
      }

      if (!code || !organizationSlug) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Missing required parameters",
        });
      }

      const organization = await db.query.organization.findFirst({
        where: eq(schema.organization.slug, organizationSlug),
      });

      if (!organization) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Exchange code for tokens using Microsoft OAuth endpoint
      const tokenResponse = await fetch(
        `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.TEAMS_CLIENT_ID!,
            client_secret: process.env.TEAMS_CLIENT_SECRET!,
            code,
            redirect_uri: `${betterAuthUrl}${teamsAddIntegrationCallbackContract.url()}`,
            grant_type: "authorization_code",
            scope: "https://graph.microsoft.com/.default",
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to exchange code for tokens: ${errorData.error_description || errorData.error}`,
        });
      }

      const tokens = await tokenResponse.json() as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
        token_type: string;
        scope: string;
      };

      // Get tenant and app info from the token
      const graphResponse = await fetch("https://graph.microsoft.com/v1.0/organization", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!graphResponse.ok) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get tenant information",
        });
      }

      const orgData = await graphResponse.json();
      const tenantInfo = orgData.value[0];

      const result = await db.transaction(async (tx) => {
        const now = new Date();

        const existingIntegration = await tx
          .select()
          .from(schema.teamsIntegration)
          .where(eq(schema.teamsIntegration.organizationId, organization.id))
          .limit(1);

        let integrationId: string | undefined;

        if (existingIntegration[0]) {
          await tx
            .update(schema.teamsIntegration)
            .set({
              tenantId: tenantInfo.id,
              teamName: tenantInfo.displayName,
              graphAccessToken: tokens.access_token,
              graphRefreshToken: tokens.refresh_token || null,
              graphScopes: tokens.scope,
              appId: process.env.TEAMS_CLIENT_ID!,
              appTenantId: tenantInfo.id,
              graphTokenExpiresAt: tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000)
                : null,
              updatedAt: now,
            })
            .where(eq(schema.teamsIntegration.id, existingIntegration[0].id));
          integrationId = existingIntegration[0].id;
        } else {
          const [newIntegration] = await tx
            .insert(schema.teamsIntegration)
            .values({
              id: generateId(),
              organizationId: organization.id,
              tenantId: tenantInfo.id,
              teamName: tenantInfo.displayName,
              botAccessToken: tokens.access_token, // Using same token for now
              graphAccessToken: tokens.access_token,
              graphRefreshToken: tokens.refresh_token || null,
              graphScopes: tokens.scope,
              appId: process.env.TEAMS_CLIENT_ID!,
              appTenantId: tenantInfo.id,
              graphTokenExpiresAt: tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000)
                : null,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
          integrationId = newIntegration.id;
        }

        return { integrationId };
      });

      // Start sync workflow
      const instanceId = await workflow.syncTeams.create({
        params: {
          integrationId: result.integrationId,
          createdByUserId: session?.user.id,
        },
      });

      await db
        .update(schema.teamsIntegration)
        .set({
          syncId: instanceId.id,
          syncStartedAt: new Date(),
        })
        .where(eq(schema.teamsIntegration.id, result.integrationId));

      return redirect(`${webAppUrl}/${organizationSlug}/settings/integrations`);
    } catch (error) {
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to complete Teams integration";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Teams integration")}&error-description=${encodeURIComponent(
          `${message}. Please try again.`,
        )}`,
      );
    }
  },
);

export const getTeamsIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getTeamsIntegrationContract
>(getTeamsIntegrationContract, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.organizationId, organization.id),
  });

  if (!integration) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Teams integration not found",
    });
  }

  return {
    id: integration.id,
    organizationId: integration.organizationId,
    tenantId: integration.tenantId,
    teamId: integration.teamId,
    teamName: integration.teamName,
    appId: integration.appId,
    botUserId: integration.botUserId,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    syncStartedAt: integration.syncStartedAt,
    syncFinishedAt: integration.syncFinishedAt,
    syncError: integration.syncError,
  };
});

export const deleteTeamsIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteTeamsIntegrationContract
>(deleteTeamsIntegrationContract, requiredOrganization, async ({ db, organization, workflow }) => {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.organizationId, organization.id),
  });

  if (!integration) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Teams integration not found",
    });
  }

  const instanceId = await workflow.deleteTeamsIntegration.create({
    params: {
      integrationId: integration.id,
    },
  });

  await db
    .update(schema.teamsIntegration)
    .set({
      deleteId: instanceId.id,
    })
    .where(eq(schema.teamsIntegration.id, integration.id));

  return { success: true };
});

export const listTeamsChannelsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listTeamsChannelsContract
>(listTeamsChannelsContract, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.organizationId, organization.id),
    with: {
      channels: {
        orderBy: (channels, { asc }) => [asc(channels.displayName)],
      },
    },
  });

  if (!integration) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Teams integration not found",
    });
  }

  return integration.channels.map((channel) => ({
    id: channel.id,
    channelId: channel.channelId,
    teamId: channel.teamId,
    displayName: channel.displayName,
    description: channel.description,
    email: channel.email,
    webUrl: channel.webUrl,
    membershipType: channel.membershipType,
    isArchived: channel.isArchived,
    createdAt: channel.createdAt,
  }));
});

export const listTeamsUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listTeamsUsersContract
>(listTeamsUsersContract, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.organizationId, organization.id),
    with: {
      users: {
        orderBy: (users, { asc }) => [asc(users.displayName)],
      },
    },
  });

  if (!integration) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Teams integration not found",
    });
  }

  return integration.users.map((user) => ({
    id: user.id,
    userId: user.userId,
    displayName: user.displayName,
    email: user.email,
    userPrincipalName: user.userPrincipalName,
    jobTitle: user.jobTitle,
    department: user.department,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
  }));
});

export const syncTeamsIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof syncTeamsIntegrationContract
>(syncTeamsIntegrationContract, requiredOrganization, async ({ db, organization, workflow }) => {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.organizationId, organization.id),
  });

  if (!integration) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Teams integration not found",
    });
  }

  if (integration.syncId) {
    throw new TypedHandlersError({
      code: "CONFLICT",
      message: "Sync is already in progress",
    });
  }

  const instanceId = await workflow.syncTeams.create({
    params: {
      integrationId: integration.id,
    },
  });

  await db
    .update(schema.teamsIntegration)
    .set({
      syncId: instanceId.id,
      syncStartedAt: new Date(),
    })
    .where(eq(schema.teamsIntegration.id, integration.id));

  return { success: true, workflowId: instanceId.id };
});

export const refreshTeamsTokenHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof refreshTeamsTokenContract
>(refreshTeamsTokenContract, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.teamsIntegration.findFirst({
    where: eq(schema.teamsIntegration.organizationId, organization.id),
  });

  if (!integration) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Teams integration not found",
    });
  }

  if (!integration.graphRefreshToken) {
    throw new TypedHandlersError({
      code: "BAD_REQUEST",
      message: "No refresh token available",
    });
  }

  // Refresh the token
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${integration.appTenantId || "common"}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: integration.appId!,
        client_secret: process.env.TEAMS_CLIENT_SECRET!,
        refresh_token: integration.graphRefreshToken,
        grant_type: "refresh_token",
        scope: integration.graphScopes || "https://graph.microsoft.com/.default",
      }),
    }
  );

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    throw new TypedHandlersError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to refresh token: ${errorData.error_description || errorData.error}`,
    });
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await db
    .update(schema.teamsIntegration)
    .set({
      graphAccessToken: tokens.access_token,
      graphRefreshToken: tokens.refresh_token || integration.graphRefreshToken,
      graphTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.teamsIntegration.id, integration.id));

  return { success: true, expiresAt };
});

function getTeamsIntegrationConnectUrl({
  clientId,
  redirectUri,
  organizationSlug,
}: {
  clientId: string;
  redirectUri: string;
  organizationSlug: string;
}) {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: [
      "offline_access",
      "https://graph.microsoft.com/Team.ReadBasic.All",
      "https://graph.microsoft.com/Channel.ReadBasic.All",
      "https://graph.microsoft.com/ChannelMessage.Read.All",
      "https://graph.microsoft.com/User.Read.All",
      "https://graph.microsoft.com/TeamsActivity.Read",
    ].join(" "),
    state: organizationSlug,
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}