import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "../db";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import {
  deleteFigmaIntegrationContract,
  figmaIntegrationCallbackContract,
  figmaWebhookContract,
  getFigmaIntegrationContract,
  listFigmaFilesContract,
  listFigmaProjectsContract,
  listFigmaTeamsContract,
  listFigmaUsersContract,
  resyncFigmaIntegrationContract,
} from "./figma-integration-contracts";
import { requiredOrganization, requiredSession } from "./middleware";
import type { FigmaWebhookEvent } from "../queue/figma-webhook-events-queue";

export const figmaIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof figmaIntegrationCallbackContract
>(
  figmaIntegrationCallbackContract,
  requiredSession,
  async ({ redirect, webAppUrl, db, input, workflow, session }) => {
    try {
      const { code, state, redirect: redirectUrl } = input as {
        code: string;
        state?: string;
        redirect?: string;
      };

      // Exchange code for access token
      const tokenResponse = await fetch("https://api.figma.com/v1/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.FIGMA_CLIENT_ID!,
          client_secret: process.env.FIGMA_CLIENT_SECRET!,
          redirect_uri: `${process.env.BETTER_AUTH_URL}/api/figma/callback`,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Failed to exchange code for token",
        });
      }

      const tokenData = await tokenResponse.json() as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        user_id: string;
      };
      const { access_token, refresh_token, expires_in, user_id } = tokenData;

      // Get user's organization
      const organizations = await db
        .select({ organization: schema.organization, member: schema.member })
        .from(schema.organization)
        .innerJoin(schema.member, eq(schema.organization.id, schema.member.organizationId))
        .where(eq(schema.member.userId, session.user.id))
        .orderBy(desc(schema.organization.createdAt))
        .limit(1);

      if (!organizations[0]) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "No organization found for user",
        });
      }

      const organization = organizations[0].organization;

      // Get user info from Figma
      const userResponse = await fetch("https://api.figma.com/v1/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Failed to get user info from Figma",
        });
      }

      const userData = await userResponse.json() as {
        teams?: Array<{ id: string; name: string }>;
      };
      const teams = userData.teams || [];

      if (teams.length === 0) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "No Figma teams found for user",
        });
      }

      // Use the first team or the one specified in state
      const selectedTeam = teams[0];
      
      if (!selectedTeam) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "No valid team found",
        });
      }

      // Check if integration already exists
      let integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.organizationId, organization.id),
      });

      const integrationId = integration?.id || generateId();

      if (integration) {
        // Update existing integration
        await db
          .update(schema.figmaIntegration)
          .set({
            accessToken: access_token,
            refreshToken: refresh_token || null,
            tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
            teamId: selectedTeam.id,
            teamName: selectedTeam.name,
            updatedAt: new Date(),
          })
          .where(eq(schema.figmaIntegration.id, integrationId));
      } else {
        // Create new integration
        await db.insert(schema.figmaIntegration).values({
          id: integrationId,
          organizationId: organization.id,
          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          accessToken: access_token,
          refreshToken: refresh_token || null,
          tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
          webhookSecret: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Trigger sync workflow
      const workflowId = await workflow.syncFigma.create({
        params: {
          integrationId,
          createdByUserId: session.user.id,
        },
      });

      await db
        .update(schema.figmaIntegration)
        .set({
          syncId: workflowId.id,
          syncStartedAt: new Date(),
        })
        .where(eq(schema.figmaIntegration.id, integrationId));

      return redirect(
        `${webAppUrl}/${organization.slug}/settings/integrations${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    } catch (error) {
      console.error("Figma integration callback error:", error);
      throw error;
    }
  },
);

export const getFigmaIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getFigmaIntegrationContract
>(
  getFigmaIntegrationContract,
  requiredOrganization,
  async ({ organization, db }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    return {
      id: integration.id,
      teamId: integration.teamId,
      teamName: integration.teamName,
      syncStartedAt: integration.syncStartedAt,
      syncFinishedAt: integration.syncFinishedAt,
      syncError: integration.syncError,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  },
);

export const deleteFigmaIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteFigmaIntegrationContract
>(
  deleteFigmaIntegrationContract,
  requiredOrganization,
  async ({ organization, db, workflow }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    // Trigger delete workflow
    await workflow.deleteFigmaIntegration.create({
      params: {
        integrationId: integration.id,
      },
    });

    return { success: true };
  },
);

export const resyncFigmaIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof resyncFigmaIntegrationContract
>(
  resyncFigmaIntegrationContract,
  requiredOrganization,
  async ({ organization, db, workflow, session }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    // Check if sync is already in progress
    if (integration.syncId) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "Sync already in progress",
      });
    }

    // Trigger sync workflow
    const workflowId = await workflow.syncFigma.create({
      params: {
        integrationId: integration.id,
        createdByUserId: session?.user.id,
      },
    });

    await db
      .update(schema.figmaIntegration)
      .set({
        syncId: workflowId.id,
        syncStartedAt: new Date(),
      })
      .where(eq(schema.figmaIntegration.id, integration.id));

    return { workflowId: workflowId.id };
  },
);

export const listFigmaTeamsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listFigmaTeamsContract
>(
  listFigmaTeamsContract,
  requiredOrganization,
  async ({ organization, db }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
      with: {
        teams: true,
      },
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    return integration.teams.map((team) => ({
      id: team.id,
      teamId: team.teamId,
      name: team.name,
      description: team.description,
      plan: team.plan,
    }));
  },
);

export const listFigmaProjectsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listFigmaProjectsContract
>(
  listFigmaProjectsContract,
  requiredOrganization,
  async ({ organization, db, input }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
      with: {
        teams: {
          with: {
            projects: true,
          },
        },
      },
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    const allProjects = integration.teams.flatMap((team) => {
      if (input.teamId && team.id !== input.teamId) {
        return [];
      }
      return team.projects.map((project) => ({
        id: project.id,
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        teamId: team.id,
      }));
    });

    return allProjects;
  },
);

export const listFigmaFilesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listFigmaFilesContract
>(
  listFigmaFilesContract,
  requiredOrganization,
  async ({ organization, db, input }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
      with: {
        teams: {
          with: {
            projects: {
              with: {
                files: true,
              },
            },
          },
        },
      },
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    const allFiles = integration.teams.flatMap((team) =>
      team.projects.flatMap((project) => {
        if (input.projectId && project.id !== input.projectId) {
          return [];
        }
        return project.files
          .filter((file) => !input.fileType || file.fileType === input.fileType)
          .map((file) => ({
            id: file.id,
            fileKey: file.fileKey,
            name: file.name,
            description: file.description,
            fileType: file.fileType as "design" | "figjam" | "dev_mode",
            thumbnailUrl: file.thumbnailUrl,
            lastModified: file.lastModified,
            projectId: project.id,
          }));
      }),
    );

    return allFiles;
  },
);

export const listFigmaUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listFigmaUsersContract
>(
  listFigmaUsersContract,
  requiredOrganization,
  async ({ organization, db }) => {
    const integration = await db.query.figmaIntegration.findFirst({
      where: eq(schema.figmaIntegration.organizationId, organization.id),
      with: {
        users: true,
      },
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Figma integration not found",
      });
    }

    return integration.users.map((user) => ({
      id: user.id,
      figmaId: user.figmaId,
      handle: user.handle,
      email: user.email,
      name: user.name,
      imgUrl: user.imgUrl,
    }));
  },
);

export const figmaWebhookHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof figmaWebhookContract
>(
  figmaWebhookContract,
  async ({ input, env }) => {
    const event = input as unknown as FigmaWebhookEvent;

    // Queue the event for processing
    await env.FIGMA_WEBHOOK_EVENTS_QUEUE.send(event);

    return { success: true };
  },
);