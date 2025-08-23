import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "../db";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteGitlabIntegrationContract,
  getGitlabIntegrationContract,
  gitlabIntegrationCallbackContract,
  listGitlabProjectsContract,
  listGitlabUsersContract,
  resyncGitlabIntegrationContract,
} from "./gitlab-integration-contracts";

export const gitlabIntegrationCallbackHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof gitlabIntegrationCallbackContract
>(
  gitlabIntegrationCallbackContract,
  requiredSession,
  async ({ redirect, webAppUrl, db, input, workflow, session, bucket, betterAuthUrl, gitlab }) => {
    try {
      const { code, state: organizationSlug, redirect: redirectUrl } = input;
      
      if (!code) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST", 
          message: "Missing authorization code",
        });
      }

      // Exchange authorization code for access token
      // The redirect URI must match EXACTLY what was sent in the OAuth request
      // Since the callback is to the API, we need to use the API endpoint URL
      // Use betterAuthUrl which should be the API base URL
      const redirectUri = `${betterAuthUrl}${gitlabIntegrationCallbackContract.url()}`;
      console.log("GitLab OAuth token exchange:", {
        client_id: gitlab.clientId,
        code,
        redirect_uri: redirectUri,
        webAppUrl,
        betterAuthUrl,
        input: input, // Log the full input to see what we received
        organizationSlug,
        redirectUrl,
      });
      
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
        console.error("GitLab token exchange failed:", {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
          headers: Object.fromEntries(tokenResponse.headers.entries()),
        });
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: `Failed to exchange authorization code for access token: ${errorText}`,
        });
      }

      const tokenData = await tokenResponse.json() as {
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

      // Get GitLab user info using the access token
      const gitlabInstanceUrl = "https://gitlab.com"; // Default to GitLab.com for now
      const userResponse = await fetch(`${gitlabInstanceUrl}/api/v4/user`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new TypedHandlersError({
          code: "UNAUTHORIZED",
          message: "Failed to authenticate with GitLab",
        });
      }

      const gitlabUser = await userResponse.json() as {
        id: number;
        name?: string;
        username: string;
        avatar_url?: string;
        email?: string;
      };
      const gitlabId = gitlabUser.id.toString();

      // Update user avatar if not set
      if (!session.user.image && gitlabUser.avatar_url) {
        try {
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
        } catch (error) {
          console.warn("Failed to update user avatar from GitLab:", error);
        }
      }

      // Update member GitLab ID if not set
      if (!results.member.gitlabId) {
        await db
          .update(schema.member)
          .set({ gitlabId })
          .where(
            and(
              eq(schema.member.organizationId, results.organization.id),
              eq(schema.member.userId, session.user.id),
            ),
          );
      }

      // Create GitLab integration
      const [newGitlabIntegration] = await db
        .insert(schema.gitlabIntegration)
        .values({
          id: generateId(),
          organizationId: results.organization.id,
          gitlabInstanceUrl,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || null,
          tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newGitlabIntegration) {
        return redirect(
          `${webAppUrl}/error?error-title=${encodeURIComponent("Failed to create GitLab integration")}&error-description=${encodeURIComponent("Failed to create GitLab integration. Please try again.")}`,
        );
      }

      // Trigger sync workflow (if available)
      if (workflow.syncGitlab) {
        try {
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
        } catch (error) {
          console.error("Failed to start GitLab sync workflow:", error);
          // Continue without failing the integration creation
        }
      } else {
        console.warn("GitLab sync workflow not configured");
      }

      return redirect(
        `${webAppUrl}/${targetOrganizationSlug}${redirectUrl ? `?redirect=${redirectUrl}` : ""}`,
      );
    } catch (error) {
      console.error("GitLab integration callback error:", error);
      throw error;
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

    return integration || null;
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

    // Trigger new sync workflow (if available)
    if (workflow.syncGitlab) {
      try {
        const workflowInstance = await workflow.syncGitlab.create({
          params: { integrationId: integration.id },
        });

        await db
          .update(schema.gitlabIntegration)
          .set({
            syncId: workflowInstance.id,
            syncStartedAt: new Date(),
            syncUpdatedAt: new Date(),
            syncFinishedAt: null,
            syncError: null,
            syncErrorAt: null,
          })
          .where(eq(schema.gitlabIntegration.id, integration.id));
      } catch (error) {
        console.error("Failed to start GitLab sync workflow:", error);
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start sync workflow",
        });
      }
    } else {
      throw new TypedHandlersError({
        code: "SERVICE_UNAVAILABLE",
        message: "GitLab sync workflow not configured",
      });
    }

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
      with: {
        projects: {
          orderBy: [schema.gitlabProject.pathWithNamespace],
        },
      },
    });

    return integration?.projects || [];
  },
);

export const listGitlabUsersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listGitlabUsersContract
>(
  listGitlabUsersContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.organizationId, organization.id),
      with: {
        users: {
          orderBy: [schema.gitlabUser.username],
        },
      },
    });

    return integration?.users || [];
  },
);

export const deleteGitlabIntegrationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteGitlabIntegrationContract
>(
  deleteGitlabIntegrationContract,
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

    // Trigger delete workflow (if available)
    if (workflow.deleteGitlabIntegration) {
      try {
        const workflowInstance = await workflow.deleteGitlabIntegration.create({
          params: { integrationId: integration.id },
        });

        await db
          .update(schema.gitlabIntegration)
          .set({
            deleteId: workflowInstance.id,
          })
          .where(eq(schema.gitlabIntegration.id, integration.id));
      } catch (error) {
        console.error("Failed to start GitLab delete workflow:", error);
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start delete workflow",
        });
      }
    } else {
      throw new TypedHandlersError({
        code: "SERVICE_UNAVAILABLE",
        message: "GitLab delete workflow not configured",
      });
    }

    return { success: true };
  },
);
