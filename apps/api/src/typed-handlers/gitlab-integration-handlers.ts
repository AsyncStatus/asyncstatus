import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { getGitlabIntegrationConnectUrl } from "../lib/integrations-connect-url";
import {
  deleteGitlabIntegrationContract,
  getGitlabIntegrationContract,
  gitlabIntegrationCallbackAddContract,
  gitlabIntegrationCallbackContract,
  listGitlabProjectsContract,
  listGitlabUsersContract,
  resyncGitlabIntegrationContract,
} from "./gitlab-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const gitlabIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof gitlabIntegrationCallbackContract
>(
  gitlabIntegrationCallbackContract,
  requiredSession,
  async ({ redirect, webAppUrl, db, input, workflow, session, gitlab, bucket, betterAuthUrl }) => {
    try {
      const { redirect: redirectUrl } = input;
      const account = await db.query.account.findFirst({
        where: and(
          eq(schema.account.userId, session.user.id),
          eq(schema.account.providerId, "gitlab"),
        ),
      });
      if (!account || !account.accessToken) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Account not found or not linked to GitLab",
        });
      }

      const gitlabInstanceUrl = "https://gitlab.com";
      const userResponse = await fetch(`${gitlabInstanceUrl}/api/v4/user`, {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          Accept: "application/json",
        },
      });

      if (!userResponse.ok) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "Failed to authenticate with GitLab",
        });
      }

      const gitlabUser = (await userResponse.json()) as {
        id: number;
        name?: string;
        username: string;
        avatar_url?: string;
        email?: string;
      };
      const gitlabId = gitlabUser.id.toString();

      const organizations = await db
        .select({ organization: schema.organization, member: schema.member })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (organizations[0]?.organization.slug) {
        const gitlabIntegration = await db.query.gitlabIntegration.findFirst({
          where: eq(schema.gitlabIntegration.organizationId, organizations[0].organization.id),
        });
        if (gitlabIntegration) {
          return redirect(
            `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
          );
        }

        if (!session.user.image && gitlabUser.avatar_url) {
          const userGitlabAvatar = await fetch(gitlabUser.avatar_url).then((res) =>
            res.arrayBuffer(),
          );
          const image = await bucket.private.put(generateId(), userGitlabAvatar);
          if (image) {
            await db
              .update(schema.user)
              .set({ image: image.key })
              .where(eq(schema.user.id, session.user.id));
          }
        }

        if (!organizations[0].member.gitlabId) {
          await db
            .update(schema.member)
            .set({ gitlabId })
            .where(
              and(
                eq(schema.member.organizationId, organizations[0].organization.id),
                eq(schema.member.userId, session.user.id),
              ),
            );
        }

        return redirect(
          getGitlabIntegrationConnectUrl({
            clientId: gitlab.clientId,
            redirectUri: `${betterAuthUrl}${gitlabIntegrationCallbackAddContract.url()}`,
            organizationSlug: organizations[0].organization.slug,
          }),
        );
      }

      let image = null;
      if (gitlabUser.avatar_url) {
        const userGitlabAvatar = await fetch(gitlabUser.avatar_url).then((res) =>
          res.arrayBuffer(),
        );
        image = await bucket.private.put(generateId(), userGitlabAvatar);
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
            gitlabId,
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
            image: image?.key || null,
            activeOrganizationSlug: newOrganization.slug,
            showOnboarding: true,
            onboardingStep: "first-step",
            onboardingCompletedAt: null,
          })
          .where(eq(schema.user.id, session.user.id));

        return { organization: newOrganization, member: newMember };
      });

      const gitlabIntegration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.organizationId, results.organization.id),
      });
      if (gitlabIntegration) {
        return redirect(
          `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      return redirect(
        getGitlabIntegrationConnectUrl({
          clientId: gitlab.clientId,
          redirectUri: `${betterAuthUrl}${gitlabIntegrationCallbackAddContract.url()}`,
          organizationSlug: results.organization.slug,
        }),
      );
    } catch {
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete GitLab integration")}&error-description=${encodeURIComponent(
          `Failed to complete GitLab integration. Please try again.`,
        )}`,
      );
    }
  },
);

export const gitlabIntegrationCallbackAddHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof gitlabIntegrationCallbackAddContract
>(
  gitlabIntegrationCallbackAddContract,
  requiredSession,
  async ({ redirect, webAppUrl, db, input, workflow, session, betterAuthUrl, gitlab }) => {
    try {
      const { code, state: organizationSlug, redirect: redirectUrl } = input;

      if (!code) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Missing authorization code",
        });
      }

      const redirectUri = `${betterAuthUrl}${gitlabIntegrationCallbackAddContract.url()}`;
      const tokenResponse = await fetch("https://gitlab.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: gitlab.clientId,
          client_secret: gitlab.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: `Failed to exchange authorization code for access token: ${errorText}`,
        });
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };

      if (!tokenData.access_token) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "No access token received from GitLab",
        });
      }

      // Get user organizations
      const organizations = await db
        .select({ organization: schema.organization, member: schema.member })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (!organizations[0]?.organization.slug) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const results = organizations[0];
      const targetOrganizationSlug = organizationSlug || results.organization.slug;

      // Check if integration already exists
      const gitlabIntegration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.organizationId, results.organization.id),
      });

      if (gitlabIntegration) {
        return redirect(
          `${webAppUrl}/${targetOrganizationSlug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      const gitlabInstanceUrl = gitlab.instanceUrl ?? "https://gitlab.com";

      const [newGitlabIntegration] = await db
        .insert(schema.gitlabIntegration)
        .values({
          id: generateId(),
          organizationId: results.organization.id,
          gitlabInstanceUrl,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000)
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newGitlabIntegration) {
        return redirect(
          `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create GitLab integration")}&error-description=${encodeURIComponent("Failed to create GitLab integration. Please try again.")}`,
        );
      }

      const workflowInstance = await workflow.syncGitlab.create({
        params: { integrationId: newGitlabIntegration.id },
      });

      await db
        .update(schema.gitlabIntegration)
        .set({
          syncId: workflowInstance.id,
          syncStartedAt: new Date(),
          syncUpdatedAt: new Date(),
        })
        .where(eq(schema.gitlabIntegration.id, newGitlabIntegration.id));

      return redirect(
        `${webAppUrl}/${targetOrganizationSlug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    } catch (error) {
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown error";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to add GitLab integration")}&error-description=${encodeURIComponent(message)}`,
      );
    }
  },
);

export const getGitlabIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getGitlabIntegrationContract
>(
  getGitlabIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return null;
    }

    return integration;
  },
);

export const resyncGitlabIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof resyncGitlabIntegrationContract
>(
  resyncGitlabIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, workflow }) => {
    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.organizationId, organization.id),
    });
    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "GitLab integration not found",
      });
    }
    if (integration.syncId) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "GitLab integration is already being synced",
      });
    }

    const workflowInstance = await workflow.syncGitlab.create({
      params: { integrationId: integration.id },
    });
    await db
      .update(schema.gitlabIntegration)
      .set({
        syncId: workflowInstance.id,
        syncStartedAt: new Date(),
        syncUpdatedAt: new Date(),
      })
      .where(eq(schema.gitlabIntegration.id, integration.id));

    return { success: true };
  },
);

export const listGitlabProjectsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listGitlabProjectsContract
>(
  listGitlabProjectsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return [];
    }

    const projects = await db.query.gitlabProject.findMany({
      where: eq(schema.gitlabProject.integrationId, integration.id),
    });

    return projects;
  },
);

export const listGitlabUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listGitlabUsersContract
>(listGitlabUsersContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.gitlabIntegration.findFirst({
    where: eq(schema.gitlabIntegration.organizationId, organization.id),
  });
  if (!integration) {
    return [];
  }

  const users = await db.query.gitlabUser.findMany({
    where: eq(schema.gitlabUser.integrationId, integration.id),
  });

  return users;
});

export const deleteGitlabIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteGitlabIntegrationContract
>(
  deleteGitlabIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, member, workflow }) => {
    if (member.role !== "admin" && member.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to disconnect GitLab",
      });
    }

    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.organizationId, organization.id),
    });
    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "GitLab integration not found",
      });
    }
    if (integration.deleteId) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "GitLab integration is already being deleted",
      });
    }

    const workflowInstance = await workflow.deleteGitlabIntegration.create({
      params: { integrationId: integration.id },
    });
    await db
      .update(schema.gitlabIntegration)
      .set({ deleteId: workflowInstance.id })
      .where(eq(schema.gitlabIntegration.id, integration.id));

    return { success: true };
  },
);
