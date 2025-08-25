import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { WebClient } from "@slack/web-api";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import type {
  TypedHandlersContext,
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { getSlackIntegrationConnectUrl } from "../lib/integrations-connect-url";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteSlackIntegrationContract,
  getSlackIntegrationContract,
  listSlackChannelsContract,
  listSlackUsersContract,
  slackAddIntegrationCallbackContract,
  slackIntegrationCallbackContract,
} from "./slack-integration-contracts";

export const slackIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof slackIntegrationCallbackContract
>(
  slackIntegrationCallbackContract,
  async ({ redirect, webAppUrl, db, input, slack, session, betterAuthUrl }) => {
    if (!session) {
      return redirect(webAppUrl);
    }

    try {
      const { redirect: redirectUrl } = input;
      const account = await db.query.account.findFirst({
        where: and(
          eq(schema.account.userId, session?.user.id),
          eq(schema.account.providerId, "slack"),
        ),
      });
      if (!account || !account.accessToken) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Account not found or not linked to Slack",
        });
      }

      const [org] = await db
        .select({
          organization: schema.organization,
          member: schema.member,
          slackIntegration: schema.slackIntegration,
        })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .leftJoin(
          schema.slackIntegration,
          eq(schema.slackIntegration.organizationId, schema.organization.id),
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
              slackId: account.accountId,
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

        const slackIntegration = await db.query.slackIntegration.findFirst({
          where: eq(schema.slackIntegration.organizationId, results.organization.id),
        });
        if (!slackIntegration || slackIntegration.syncError) {
          return redirect(
            getSlackIntegrationConnectUrl({
              clientId: slack.clientId,
              redirectUri: `${betterAuthUrl}${slackAddIntegrationCallbackContract.url()}`,
              organizationSlug: results.organization.slug,
            }),
          );
        }

        return redirect(
          `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      if (org?.organization.slug && !org.slackIntegration) {
        return redirect(
          getSlackIntegrationConnectUrl({
            clientId: slack.clientId,
            redirectUri: `${betterAuthUrl}${slackAddIntegrationCallbackContract.url()}`,
            organizationSlug: org.organization.slug,
          }),
        );
      }

      if (org?.organization.slug && org.slackIntegration) {
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
            : "Failed to complete Slack integration. Please try again.";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Slack integration")}&error-description=${encodeURIComponent(
          `${message}. Please try again.`,
        )}`,
      );
    }
  },
);

export const slackAddIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof slackAddIntegrationCallbackContract
>(
  slackAddIntegrationCallbackContract,
  async ({ redirect, webAppUrl, db, input, slack, workflow, betterAuthUrl, session }) => {
    try {
      const { code, state: organizationSlug } = input;
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

      const slackClient = new WebClient();
      const response = await slackClient.oauth.v2.access({
        client_id: slack.clientId,
        client_secret: slack.clientSecret,
        code,
        redirect_uri: `${betterAuthUrl}${slackAddIntegrationCallbackContract.url()}`,
      });

      if (!response.ok || !response.access_token || !response.team?.id) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to exchange code for access token",
        });
      }

      if (response.is_enterprise_install) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Enterprise installations are not supported",
        });
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
              syncId: null,
              syncUpdatedAt: null,
              syncStartedAt: null,
              syncFinishedAt: null,
              syncError: null,
              syncErrorAt: null,
              deleteId: null,
              deleteError: null,
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
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create Slack integration",
          });
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
        params: {
          integrationId: result.integrationId,
          createdByUserId: session?.user.id,
        },
      });

      await db
        .update(schema.slackIntegration)
        .set({
          syncId: workflowInstance.id,
          syncStartedAt: new Date(),
          syncUpdatedAt: new Date(),
        })
        .where(eq(schema.slackIntegration.id, result.integrationId));

      return redirect(`${webAppUrl}/${organization.slug}/integrations`);
    } catch (error) {
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to complete Slack integration. Please try again.";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Slack integration")}&error-description=${encodeURIComponent(
          `${message}. Please try again.`,
        )}`,
      );
    }
  },
);

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
