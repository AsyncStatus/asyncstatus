import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContext, TypedHandlersContextWithOrganization } from "../lib/env";
import {
  deleteGithubIntegrationContract,
  getGithubIntegrationContract,
  githubIntegrationCallbackContract,
  listGithubRepositoriesContract,
  listGithubUsersContract,
} from "./github-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const githubIntegrationCallbackHandler = typedHandler<
  TypedHandlersContext,
  typeof githubIntegrationCallbackContract
>(githubIntegrationCallbackContract, async ({ redirect, webAppUrl, db, input, workflow }) => {
  const { installation_id: installationId, state: organizationSlug } = input;

  if (!installationId || !organizationSlug) {
    return redirect(`${webAppUrl}/error?message=Missing required parameters`);
  }

  try {
    const organization = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, organizationSlug),
    });
    if (!organization) {
      return redirect(`${webAppUrl}/error?message=Organization not found`);
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
      return redirect(`${webAppUrl}/error?message=Failed to create GitHub integration`);
    }

    const workflowInstance = await workflow.syncGithub.create({
      params: { integrationId },
    });
    await db
      .update(schema.githubIntegration)
      .set({ syncId: workflowInstance.id })
      .where(eq(schema.githubIntegration.id, integrationId));

    return redirect(`${webAppUrl}/${organization.slug}/settings?tab=integrations`);
  } catch (error) {
    return redirect(
      `${webAppUrl}/error?message=Failed to connect GitHub: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
});

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
