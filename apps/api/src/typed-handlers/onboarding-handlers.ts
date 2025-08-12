import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { Octokit } from "octokit";
import * as schema from "../db";
import type { Session } from "../lib/auth";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  onboardingSelectGithubRepositoriesContract,
  updateUserOnboardingContract,
} from "./onboarding-contracts";

export const updateUserOnboardingHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof updateUserOnboardingContract
>(updateUserOnboardingContract, requiredSession, async ({ db, session, input, authKv }) => {
  const updates: Partial<typeof updateUserOnboardingContract.$infer.input> = {};

  if (input.showOnboarding !== undefined) {
    updates.showOnboarding = input.showOnboarding;
  }

  if (input.onboardingStep !== undefined) {
    updates.onboardingStep = input.onboardingStep;
  }

  if (input.onboardingCompletedAt !== undefined) {
    updates.onboardingCompletedAt = input.onboardingCompletedAt;
  }

  await db
    .update(schema.user)
    .set(updates as any)
    .where(eq(schema.user.id, session.user.id));

  const data = await authKv.get<Session>(session.session.token, {
    type: "json",
  });
  if (!data) {
    throw new TypedHandlersError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  await authKv.put(
    session.session.token,
    JSON.stringify({ ...data, user: { ...data.user, ...updates } }),
  );

  const user = await db.query.user.findFirst({ where: eq(schema.user.id, session.user.id) });
  if (!user) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return user;
});

export const onboardingSelectGithubRepositoriesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof onboardingSelectGithubRepositoriesContract
>(
  onboardingSelectGithubRepositoriesContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, redirect, webAppUrl, github, session, workflow }) => {
    try {
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
        return redirect(`${webAppUrl}/${organization.slug}`);
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
          .set({ installationId: asyncStatusInstallation.id.toString(), updatedAt: new Date() })
          .where(eq(schema.githubIntegration.id, existingIntegration[0].id))
          .returning();

        integrationId = existingIntegration[0].id;
      } else {
        const newIntegration = await db
          .insert(schema.githubIntegration)
          .values({
            id: generateId(),
            organizationId: organization.id,
            installationId: asyncStatusInstallation.id.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        integrationId = newIntegration[0]?.id;
      }
      if (!integrationId) {
        return redirect(
          `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create GitHub integration")}&error-description=${encodeURIComponent("Failed to create GitHub integration. Please try again.")}`,
        );
      }

      const workflowInstance = await workflow.syncGithub.create({
        params: { integrationId, prefetchPastEvents: true },
      });
      await db
        .update(schema.githubIntegration)
        .set({ syncId: workflowInstance.id })
        .where(eq(schema.githubIntegration.id, integrationId));

      return redirect(`${webAppUrl}/${organization.slug}`);
    } catch {
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent(
          "Failed to create GitHub integration",
        )}&error-description=${encodeURIComponent(
          `Failed to create GitHub integration. Please try again.`,
        )}`,
      );
    }
  },
);
