import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { WebClient } from "@slack/web-api";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "../db";
import type {
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
  slackIntegrationCallbackContract,
} from "./slack-integration-contracts";

export const slackIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof slackIntegrationCallbackContract
>(
  slackIntegrationCallbackContract,
  async ({ redirect, webAppUrl, db, input, slack, workflow, session, betterAuthUrl }) => {
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

      // Get Slack user info
      const slackClient = new WebClient(account.accessToken);
      const userResponse = await slackClient.auth.test().catch((error) => {
        console.log(error);
        return null;
      });

      if (!userResponse?.ok || !userResponse?.user_id || !userResponse?.team_id) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "Failed to get Slack user info",
        });
      }

      const slackUserId = userResponse.user_id;

      const organizations = await db
        .select({ organization: schema.organization, member: schema.member })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (organizations[0]?.organization.slug) {
        const slackIntegration = await db.query.slackIntegration.findFirst({
          where: eq(schema.slackIntegration.organizationId, organizations[0].organization.id),
        });
        if (slackIntegration) {
          return redirect(
            `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
          );
        }

        // Get team info
        const teamResponse = await slackClient.team.info().catch((error) => {
          console.log(error);
          return null;
        });
        console.log(teamResponse);
        if (!teamResponse?.ok || !teamResponse?.team) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get Slack team info",
          });
        }

        const team = teamResponse.team;

        const [newSlackIntegration] = await db
          .insert(schema.slackIntegration)
          .values({
            id: generateId(),
            organizationId: organizations[0].organization.id,
            teamId: team.id!,
            teamName: team.name || null,
            enterpriseId: team.enterprise_id || null,
            enterpriseName: team.enterprise_name || null,
            botAccessToken: account.accessToken,
            botScopes: account.scope || null,
            botUserId: slackUserId,
            appId: slack.appId,
            tokenExpiresAt: account.accessTokenExpiresAt,
            refreshToken: account.refreshToken,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        if (!newSlackIntegration) {
          return redirect(
            `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create Slack integration")}&error-description=${encodeURIComponent("Failed to create Slack integration. Please try again.")}`,
          );
        }

        await db
          .update(schema.member)
          .set({ slackId: slackUserId })
          .where(
            and(
              eq(schema.member.organizationId, organizations[0].organization.id),
              eq(schema.member.userId, session?.user.id),
            ),
          );

        const workflowInstance = await workflow.syncSlack.create({
          params: { integrationId: newSlackIntegration.id },
        });

        await db
          .update(schema.slackIntegration)
          .set({ syncId: workflowInstance.id })
          .where(eq(schema.slackIntegration.id, newSlackIntegration.id));

        return redirect(
          `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      const results = await db.transaction(async (tx) => {
        const now = dayjs();
        const name = `${session?.user.name || "My"} Org`;
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
            userId: session?.user.id,
            role: "owner",
            createdAt: now.toDate(),
            slackId: slackUserId,
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
          .where(eq(schema.user.id, session?.user.id));

        return { organization: newOrganization, member: newMember };
      });

      const slackIntegration = await db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.organizationId, results.organization.id),
      });
      if (slackIntegration) {
        return redirect(
          `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      // Get team info
      const teamResponse = await slackClient.team.info();
      if (!teamResponse.ok || !teamResponse.team) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get Slack team info",
        });
      }

      const team = teamResponse.team;

      const [newSlackIntegration] = await db
        .insert(schema.slackIntegration)
        .values({
          id: generateId(),
          organizationId: results.organization.id,
          teamId: team.id!,
          teamName: team.name || null,
          enterpriseId: team.enterprise_id || null,
          enterpriseName: team.enterprise_name || null,
          botAccessToken: account.accessToken,
          botScopes: account.scope || null,
          botUserId: slackUserId,
          appId: slack.appId,
          tokenExpiresAt: account.accessTokenExpiresAt,
          refreshToken: account.refreshToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      if (!newSlackIntegration) {
        return redirect(
          `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create Slack integration")}&error-description=${encodeURIComponent("Failed to create Slack integration. Please try again.")}`,
        );
      }

      const workflowInstance = await workflow.syncSlack.create({
        params: { integrationId: newSlackIntegration.id },
      });

      await db
        .update(schema.slackIntegration)
        .set({ syncId: workflowInstance.id })
        .where(eq(schema.slackIntegration.id, newSlackIntegration.id));

      return redirect(
        `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    } catch (error) {
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to complete Slack integration. Please try again.";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Slack integration")}&error-description=${encodeURIComponent(
          message,
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
