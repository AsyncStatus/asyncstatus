import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../db";
import type {
  TypedHandlersContext,
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { createLinearClient, exchangeLinearCodeForToken } from "../lib/linear-client";
import { requiredOrganization, requiredSession } from "./middleware";
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

      const viewer = await linearClient.viewer;
      const organization = await linearClient.organization;

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
            teamId: organization.id,
            teamName: organization.name,
            teamKey: organization.key,
            accessToken: tokenResponse.access_token,
            refreshToken: null,
            tokenExpiresAt: tokenResponse.expires_in
              ? now.add(tokenResponse.expires_in, "second").toDate()
              : null,
            userId: viewer.id,
            userEmail: viewer.email,
            scope: tokenResponse.scope.join(" "),
            updatedAt: now.toDate(),
            syncError: null,
            syncErrorAt: null,
          })
          .where(eq(schema.linearIntegration.id, existingIntegration.id));
      } else {
        await db.insert(schema.linearIntegration).values({
          id: integrationId,
          organizationId: org.id,
          teamId: organization.id,
          teamName: organization.name,
          teamKey: organization.key,
          accessToken: tokenResponse.access_token,
          refreshToken: null,
          tokenExpiresAt: tokenResponse.expires_in
            ? now.add(tokenResponse.expires_in, "second").toDate()
            : null,
          userId: viewer.id,
          userEmail: viewer.email,
          scope: tokenResponse.scope.join(" "),
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
      await workflowInstance.run();

      return redirect(`${webAppUrl}/${organizationSlug}/settings/integrations`);
    } catch (error) {
      console.error("Linear integration callback error:", error);
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to connect Linear integration",
      });
    }
  },
  [requiredSession],
);

export const resyncLinearIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof resyncLinearIntegrationContract
>(
  resyncLinearIntegrationContract,
  async ({ json, db, organization, member, workflow }) => {
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

    const workflowInstance = await workflow.syncLinear.create({
      id: workflowId,
      params: { integrationId: integration.id },
    });
    await workflowInstance.run();

    return json({
      success: true,
      workflowId,
    });
  },
  [requiredSession, requiredOrganization],
);

export const getLinearIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getLinearIntegrationContract
>(
  getLinearIntegrationContract,
  async ({ json, db, organization }) => {
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    return json({
      integration: integration
        ? {
            id: integration.id,
            organizationId: integration.organizationId,
            teamId: integration.teamId,
            teamName: integration.teamName,
            syncStartedAt: integration.syncStartedAt,
            syncFinishedAt: integration.syncFinishedAt,
            syncError: integration.syncError,
            syncErrorAt: integration.syncErrorAt,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
          }
        : null,
    });
  },
  [requiredSession, requiredOrganization],
);

export const listLinearTeamsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearTeamsContract
>(
  listLinearTeamsContract,
  async ({ json, db, organization }) => {
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Linear integration not found",
      });
    }

    const teams = await db.query.linearTeam.findMany({
      where: eq(schema.linearTeam.integrationId, integration.id),
      orderBy: [desc(schema.linearTeam.createdAt)],
    });

    return json({
      teams: teams.map((team) => ({
        id: team.id,
        teamId: team.teamId,
        name: team.name,
        key: team.key,
        description: team.description,
        private: team.private,
        issueCount: team.issueCount,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
    });
  },
  [requiredSession, requiredOrganization],
);

export const listLinearUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearUsersContract
>(
  listLinearUsersContract,
  async ({ json, db, organization }) => {
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Linear integration not found",
      });
    }

    const users = await db.query.linearUser.findMany({
      where: eq(schema.linearUser.integrationId, integration.id),
      orderBy: [desc(schema.linearUser.createdAt)],
    });

    return json({
      users: users.map((user) => ({
        id: user.id,
        userId: user.userId,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        admin: user.admin,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  },
  [requiredSession, requiredOrganization],
);

export const listLinearIssuesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearIssuesContract
>(
  listLinearIssuesContract,
  async ({ json, db, organization, input }) => {
    const { limit, offset } = input;

    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Linear integration not found",
      });
    }

    const [issues, [{ count }]] = await Promise.all([
      db.query.linearIssue.findMany({
        where: eq(schema.linearIssue.integrationId, integration.id),
        orderBy: [desc(schema.linearIssue.createdAt)],
        limit,
        offset,
      }),
      db
        .select({ count: db.$count(schema.linearIssue) })
        .from(schema.linearIssue)
        .where(eq(schema.linearIssue.integrationId, integration.id)),
    ]);

    return json({
      issues: issues.map((issue) => ({
        id: issue.id,
        issueId: issue.issueId,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        state: issue.state,
        stateType: issue.stateType,
        priority: issue.priority,
        priorityLabel: issue.priorityLabel,
        assigneeId: issue.assigneeId,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      })),
      total: count,
    });
  },
  [requiredSession, requiredOrganization],
);

export const listLinearProjectsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listLinearProjectsContract
>(
  listLinearProjectsContract,
  async ({ json, db, organization }) => {
    const integration = await db.query.linearIntegration.findFirst({
      where: eq(schema.linearIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Linear integration not found",
      });
    }

    const projects = await db.query.linearProject.findMany({
      where: eq(schema.linearProject.integrationId, integration.id),
      orderBy: [desc(schema.linearProject.createdAt)],
    });

    return json({
      projects: projects.map((project) => ({
        id: project.id,
        projectId: project.projectId,
        name: project.name,
        key: project.key,
        description: project.description,
        state: project.state,
        issueCount: project.issueCount,
        completedIssueCount: project.completedIssueCount,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      })),
    });
  },
  [requiredSession, requiredOrganization],
);

export const deleteLinearIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteLinearIntegrationContract
>(
  deleteLinearIntegrationContract,
  async ({ json, db, organization, member, workflow }) => {
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

    const workflowInstance = await workflow.deleteLinearIntegration.create({
      id: workflowId,
      params: { integrationId: integration.id },
    });
    await workflowInstance.run();

    return json({
      success: true,
      workflowId,
    });
  },
  [requiredSession, requiredOrganization],
);