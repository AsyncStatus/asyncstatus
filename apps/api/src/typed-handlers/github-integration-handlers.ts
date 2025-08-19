import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { Octokit } from "octokit";
import * as schema from "../db";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { getGithubIntegrationConnectUrl } from "../lib/integrations-connect-url";
import {
  deleteGithubIntegrationContract,
  getGithubIntegrationContract,
  githubIntegrationCallbackContract,
  listGithubRepositoriesContract,
  listGithubUsersContract,
  resyncGithubIntegrationContract,
} from "./github-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const githubIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof githubIntegrationCallbackContract
>(
  githubIntegrationCallbackContract,
  requiredSession,
  async ({ redirect, webAppUrl, db, input, workflow, session, github, bucket, betterAuthUrl }) => {
    try {
      const { redirect: redirectUrl } = input;
      const account = await db.query.account.findFirst({
        where: and(
          eq(schema.account.userId, session.user.id),
          eq(schema.account.providerId, "github"),
        ),
      });
      if (!account || !account.accessToken) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Account not found or not linked to GitHub",
        });
      }

      const octokit = new Octokit({ auth: account.accessToken });
      const user = await octokit.request("GET /user", {
        headers: {
          accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      const githubId = user.data.id.toString();

      const organizations = await db
        .select({ organization: schema.organization, member: schema.member })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (organizations[0]?.organization.slug) {
        const githubIntegration = await db.query.githubIntegration.findFirst({
          where: eq(schema.githubIntegration.organizationId, organizations[0].organization.id),
        });
        if (githubIntegration) {
          return redirect(
            `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
          );
        }

        const installations = await octokit.request("GET /user/installations", {
          headers: {
            accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });
        const asyncStatusInstallation = installations.data.installations.find(
          (installation) => installation.app_id === Number(github.appId),
        );
        if (!asyncStatusInstallation) {
          return redirect(
            getGithubIntegrationConnectUrl({
              clientId: github.appName,
              redirectUri: `${betterAuthUrl}${githubIntegrationCallbackContract.url()}`,
              organizationSlug: organizations[0].organization.slug,
            }),
          );
        }

        if (!session.user.image) {
          const userGithubAvatar = await fetch(user.data.avatar_url).then((res) =>
            res.arrayBuffer(),
          );
          const image = await bucket.private.put(generateId(), userGithubAvatar);
          if (image) {
            await db
              .update(schema.user)
              .set({ image: image.key })
              .where(eq(schema.user.id, session.user.id));
          }
        }

        if (!organizations[0].member.githubId) {
          await db
            .update(schema.member)
            .set({ githubId })
            .where(
              and(
                eq(schema.member.organizationId, organizations[0].organization.id),
                eq(schema.member.userId, session.user.id),
              ),
            );
        }

        const [newGithubIntegration] = await db
          .insert(schema.githubIntegration)
          .values({
            id: generateId(),
            organizationId: organizations[0].organization.id,
            installationId: asyncStatusInstallation.id.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        if (!newGithubIntegration) {
          return redirect(
            `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create GitHub integration")}&error-description=${encodeURIComponent("Failed to create GitHub integration. Please try again.")}`,
          );
        }

        const workflowInstance = await workflow.syncGithub.create({
          params: { integrationId: newGithubIntegration.id },
        });

        await db
          .update(schema.githubIntegration)
          .set({
            syncId: workflowInstance.id,
            syncStartedAt: new Date(),
            syncUpdatedAt: new Date(),
          })
          .where(eq(schema.githubIntegration.id, newGithubIntegration.id));

        return redirect(
          `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      const userGithubAvatar = await fetch(user.data.avatar_url).then((res) => res.arrayBuffer());
      const image = await bucket.private.put(generateId(), userGithubAvatar);

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
            githubId,
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

      const githubIntegration = await db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.organizationId, results.organization.id),
      });
      if (githubIntegration) {
        return redirect(
          `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
        );
      }

      const installations = await octokit.request("GET /user/installations", {
        headers: {
          accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      const asyncStatusInstallation = installations.data.installations.find(
        (installation) => installation.app_id === Number(github.appId),
      );
      if (!asyncStatusInstallation) {
        return redirect(
          getGithubIntegrationConnectUrl({
            clientId: github.appName,
            redirectUri: `${betterAuthUrl}${githubIntegrationCallbackContract.url()}`,
            organizationSlug: results.organization.slug,
          }),
        );
      }

      const [newGithubIntegration] = await db
        .insert(schema.githubIntegration)
        .values({
          id: generateId(),
          organizationId: results.organization.id,
          installationId: asyncStatusInstallation.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      if (!newGithubIntegration) {
        return redirect(
          `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create GitHub integration")}&error-description=${encodeURIComponent("Failed to create GitHub integration. Please try again.")}`,
        );
      }

      const workflowInstance = await workflow.syncGithub.create({
        params: { integrationId: newGithubIntegration.id },
      });

      await db
        .update(schema.githubIntegration)
        .set({
          syncId: workflowInstance.id,
          syncStartedAt: new Date(),
          syncUpdatedAt: new Date(),
        })
        .where(eq(schema.githubIntegration.id, newGithubIntegration.id));

      return redirect(
        `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    } catch {
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete GitHub integration")}&error-description=${encodeURIComponent(
          `Failed to complete GitHub integration. Please try again.`,
        )}`,
      );
    }
  },
);

export const resyncGithubIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof resyncGithubIntegrationContract
>(
  resyncGithubIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, workflow }) => {
    const integration = await db.query.githubIntegration.findFirst({
      where: eq(schema.githubIntegration.organizationId, organization.id),
    });
    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "GitHub integration not found",
      });
    }
    if (integration.syncId) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "GitHub integration is already being synced",
      });
    }

    const workflowInstance = await workflow.syncGithub.create({
      params: { integrationId: integration.id },
    });
    await db
      .update(schema.githubIntegration)
      .set({
        syncId: workflowInstance.id,
        syncStartedAt: new Date(),
        syncUpdatedAt: new Date(),
      })
      .where(eq(schema.githubIntegration.id, integration.id));

    return { success: true };
  },
);

export const getGithubIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getGithubIntegrationContract
>(
  getGithubIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.githubIntegration.findFirst({
      where: eq(schema.githubIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return null;
    }

    return integration;
  },
);

export const listGithubRepositoriesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listGithubRepositoriesContract
>(
  listGithubRepositoriesContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.githubIntegration.findFirst({
      where: eq(schema.githubIntegration.organizationId, organization.id),
    });
    if (!integration) {
      return [];
    }

    const repositories = await db.query.githubRepository.findMany({
      where: eq(schema.githubRepository.integrationId, integration.id),
    });

    return repositories;
  },
);

export const listGithubUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listGithubUsersContract
>(listGithubUsersContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.githubIntegration.findFirst({
    where: eq(schema.githubIntegration.organizationId, organization.id),
  });
  if (!integration) {
    return [];
  }

  const users = await db.query.githubUser.findMany({
    where: eq(schema.githubUser.integrationId, integration.id),
  });

  return users;
});

export const deleteGithubIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteGithubIntegrationContract
>(
  deleteGithubIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, member, workflow }) => {
    if (member.role !== "admin" && member.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to disconnect GitHub",
      });
    }

    const integration = await db.query.githubIntegration.findFirst({
      where: eq(schema.githubIntegration.organizationId, organization.id),
    });
    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "GitHub integration not found",
      });
    }
    if (integration.deleteId) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "GitHub integration is already being deleted",
      });
    }

    const workflowInstance = await workflow.deleteGithubIntegration.create({
      params: { integrationId: integration.id },
    });
    await db
      .update(schema.githubIntegration)
      .set({ deleteId: workflowInstance.id })
      .where(eq(schema.githubIntegration.id, integration.id));

    return { success: true };
  },
);
