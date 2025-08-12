import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import slugify from "@sindresorhus/slugify";
import { generateId } from "better-auth";
import { desc, eq } from "drizzle-orm";
import { Octokit } from "octokit";
import * as schema from "../db";
import type {
  TypedHandlersContext,
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import {
  deleteGithubIntegrationContract,
  getGithubIntegrationContract,
  githubIntegrationCallbackContract,
  githubUserCallbackContract,
  listGithubRepositoriesContract,
  listGithubUsersContract,
  resyncGithubIntegrationContract,
} from "./github-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const githubIntegrationCallbackHandler = typedHandler<
  TypedHandlersContext,
  typeof githubIntegrationCallbackContract
>(githubIntegrationCallbackContract, async ({ redirect, webAppUrl, db, input, workflow }) => {
  const { installation_id: installationId, state: organizationSlug } = input;

  if (!installationId || !organizationSlug) {
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

    const existingIntegration = await db
      .select()
      .from(schema.githubIntegration)
      .where(eq(schema.githubIntegration.organizationId, organization.id))
      .limit(1);

    let integrationId: string | undefined;

    if (existingIntegration[0]) {
      await db
        .update(schema.githubIntegration)
        .set({ installationId, updatedAt: new Date() })
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
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create GitHub integration")}&error-description=${encodeURIComponent("Failed to create GitHub integration.")}`,
      );
    }

    const workflowInstance = await workflow.syncGithub.create({
      params: { integrationId },
    });
    await db
      .update(schema.githubIntegration)
      .set({ syncId: workflowInstance.id })
      .where(eq(schema.githubIntegration.id, integrationId));

    return redirect(`${webAppUrl}/${organization.slug}/integrations`);
  } catch {
    return redirect(
      `${webAppUrl}/${organizationSlug}/integrations?error-title=${encodeURIComponent("GitHub integration error")}&error-description=${encodeURIComponent(
        `Failed to complete GitHub integration. Please try again.`,
      )}`,
    );
  }
});

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
      .set({ syncId: workflowInstance.id })
      .where(eq(schema.githubIntegration.id, integration.id));

    return { success: true };
  },
);

export const githubUserCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof githubUserCallbackContract
>(
  githubUserCallbackContract,
  requiredSession,
  async ({ db, session, input, redirect, webAppUrl }) => {
    const { redirect: redirectUrl } = input;
    const account = await db.query.account.findFirst({
      where: eq(schema.account.userId, session.user.id),
    });
    if (!account || account.providerId !== "github" || !account.accessToken) {
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
      return redirect(
        `${webAppUrl}/${organizations[0].organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    }

    const results = await db.transaction(async (tx) => {
      const now = dayjs();
      const [newOrganization] = await tx
        .insert(schema.organization)
        .values({
          id: generateId(),
          name: `${session.user.name}'s Org`,
          slug: `${slugify(session.user.name)}-${generateId(4)}`,
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
          activeOrganizationSlug: newOrganization.slug,
          showOnboarding: true,
          onboardingStep: "first-step",
          onboardingCompletedAt: null,
        })
        .where(eq(schema.user.id, session.user.id));

      return { organization: newOrganization, member: newMember };
    });

    return redirect(
      `${webAppUrl}/${results.organization.slug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
    );
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
