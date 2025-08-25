import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { createLinearClient, exchangeLinearCodeForToken } from "../lib/linear-client";
import {
  deleteLinearIntegrationContract,
  getLinearIntegrationContract,
  linearIntegrationCallbackContract,
  listLinearIssuesContract,
  listLinearProjectsContract,
  listLinearTeamsContract,
  listLinearUsersContract,
  resyncLinearIntegrationContract,
} from "./linear-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const linearIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof linearIntegrationCallbackContract
>(
  linearIntegrationCallbackContract,
  async ({ redirect, webAppUrl, db, input, linear, session, betterAuthUrl, workflow }) => {
    if (!session) {
      return redirect(webAppUrl);
    }

    try {
      const { code, state: organizationSlug } = input;

      if (!organizationSlug) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Organization slug is required",
        });
      }

      const redirectUri = `${betterAuthUrl}${linearIntegrationCallbackContract.url()}`;

      const tokenResponse = await exchangeLinearCodeForToken({
        code,
        clientId: linear.clientId,
        clientSecret: linear.clientSecret,
        redirectUri,
      });

      const linearClient = createLinearClient({ accessToken: tokenResponse.access_token });

      const linearViewer = await linearClient.viewer;
      const linearOrganization = await linearClient.organization;

      const org = await db.query.organization.findFirst({
        where: eq(schema.organization.slug, organizationSlug),
      });

      if (!org) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const member = await db.query.member.findFirst({
        where: and(
          eq(schema.member.organizationId, org.id),
          eq(schema.member.userId, session.user.id),
        ),
      });

      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TypedHandlersError({
          code: "FORBIDDEN",
          message: "You must be an owner or admin to add integrations",
        });
      }

      const existingIntegration = await db.query.linearIntegration.findFirst({
        where: eq(schema.linearIntegration.organizationId, org.id),
      });

      const integrationId = existingIntegration?.id ?? nanoid();
      const now = dayjs();

      if (existingIntegration) {
        await db
          .update(schema.linearIntegration)
          .set({
            teamId: linearOrganization.id,
            teamName: linearOrganization.name,
            teamKey: linearOrganization.urlKey,
            accessToken: tokenResponse.access_token,
            refreshToken: null,
            tokenExpiresAt: tokenResponse.expires_in
              ? now.add(tokenResponse.expires_in, "second").toDate()
              : null,
            userId: linearViewer.id,
            userEmail: linearViewer.email,
            scope: tokenResponse.scope,
            updatedAt: now.toDate(),
            syncError: null,
            syncErrorAt: null,
          })
          .where(eq(schema.linearIntegration.id, existingIntegration.id));
      } else {
        await db.insert(schema.linearIntegration).values({
          id: integrationId,
          organizationId: org.id,
          teamId: linearOrganization.id,
          teamName: linearOrganization.name,
          teamKey: linearOrganization.urlKey,
          accessToken: tokenResponse.access_token,
          refreshToken: null,
          tokenExpiresAt: tokenResponse.expires_in
            ? now.add(tokenResponse.expires_in, "second").toDate()
            : null,
          userId: linearViewer.id,
          userEmail: linearViewer.email,
          scope: tokenResponse.scope,
          createdAt: now.toDate(),
          updatedAt: now.toDate(),
        });
      }

      const workflowId = nanoid();
      await db
        .update(schema.linearIntegration)
        .set({
          syncId: workflowId,
          syncStartedAt: now.toDate(),
        })
        .where(eq(schema.linearIntegration.id, integrationId));

      const workflowInstance = await workflow.syncLinear.create({
        id: workflowId,
        params: { integrationId },
      });

      await db
        .update(schema.linearIntegration)
        .set({ syncId: workflowInstance.id, syncStartedAt: now.toDate() })
        .where(eq(schema.linearIntegration.id, integrationId));

      return redirect(webAppUrl);
    } catch (error) {
      console.error("Linear integration callback error:", error);
      const message =
        error instanceof TypedHandlersError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to connect Linear integration";
      return redirect(
        `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to complete Slack integration")}&error-description=${encodeURIComponent(
          `${message}. Please try again.`,
        )}`,
      );
    }
  },
);

export const resyncLinearIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof resyncLinearIntegrationContract
>(
  resyncLinearIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, member, workflow }) => {
    if (member.role !== "owner" && member.role !== "admin") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You must be an owner or admin to resync integrations",
      });
    }

    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Linear integration not found",
      });
    }

    const workflowId = nanoid();
    await db
      .update(schema.linearIntegration)
      .set({
        syncId: workflowId,
        syncStartedAt: new Date(),
      })
      .where(eq(schema.linearIntegration.id, integration.id));

    await workflow.syncLinear.create({
      id: workflowId,
      params: { integrationId: integration.id },
    });

    return {
      success: true,
      workflowId,
    };
  },
);

export const getLinearIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getLinearIntegrationContract
>(
  getLinearIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    return integration ?? null;
  },
);

export const listLinearTeamsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearTeamsContract
>(listLinearTeamsContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.linearIntegration.findFirst({
    where: eq(schema.linearIntegration.organizationId, organization.id),
  });

  if (!integration) {
    return [];
  }

  const teams = await db.query.linearTeam.findMany({
    where: eq(schema.linearTeam.integrationId, integration.id),
    orderBy: [desc(schema.linearTeam.createdAt)],
  });

  return teams;
});

export const listLinearUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearUsersContract
>(listLinearUsersContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const integration = await db.query.linearIntegration.findFirst({
    where: eq(schema.linearIntegration.organizationId, organization.id),
  });

  if (!integration) {
    return [];
  }

  const users = await db.query.linearUser.findMany({
    where: eq(schema.linearUser.integrationId, integration.id),
    orderBy: [desc(schema.linearUser.createdAt)],
  });

  return users;
});

export const listLinearIssuesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearIssuesContract
>(
  listLinearIssuesContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      return [];
    }

    const [issues] = await Promise.all([
      db.query.linearIssue.findMany({
        where: eq(schema.linearIssue.integrationId, integration.id),
        orderBy: [desc(schema.linearIssue.createdAt)],
        limit: limit as number,
        offset: offset as number,
      }),
    ]);

    return issues;
  },
);

export const listLinearProjectsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearProjectsContract
>(
  listLinearProjectsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      return [];
    }

    const projects = await db.query.linearProject.findMany({
      where: eq(schema.linearProject.integrationId, integration.id),
      orderBy: [desc(schema.linearProject.createdAt)],
    });

    return projects;
  },
);

export const deleteLinearIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteLinearIntegrationContract
>(
  deleteLinearIntegrationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, member, workflow }) => {
    if (member.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only owners can delete integrations",
      });
    }

    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Linear integration not found",
      });
    }

    const workflowId = nanoid();
    await db
      .update(schema.linearIntegration)
      .set({
        deleteId: workflowId,
      })
      .where(eq(schema.linearIntegration.id, integration.id));

    await workflow.deleteLinearIntegration.create({
      id: workflowId,
      params: { integrationId: integration.id },
    });

    return {
      success: true,
      workflowId,
    };
  },
);
