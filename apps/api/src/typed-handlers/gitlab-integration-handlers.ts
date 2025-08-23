import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "../db";
import { 
  setupGitlabProjectWebhook, 
  findWebhookByUrl, 
  testGitlabApiConnection,
  getWebhookSetupInfo 
} from "../lib/gitlab-webhook";
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
  setupGitlabWebhooksContract,
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

      // Set up webhook for the integration immediately
      let webhookSetupError: string | null = null;
      try {
        const webhookUrl = `${betterAuthUrl}/integrations/gitlab/webhooks`;
        const webhookSecret = gitlab?.webhookSecret;
        
        console.log(`🚀 GitLab webhook setup initiated`);
        console.log(`   - Secret available: ${!!webhookSecret}`);
        console.log(`   - Webhook URL: ${webhookUrl}`);
        console.log(`   - GitLab instance: ${gitlabInstanceUrl}`);
        
        if (!webhookSecret) {
          webhookSetupError = "GitLab webhook secret not configured - please set GITLAB_WEBHOOK_SECRET environment variable.";
          console.warn(`⚠️ ${webhookSetupError}`);
        } else {
          // Test GitLab API connection first
          console.log(`🔍 Testing GitLab API connection...`);
          const connectionTest = await testGitlabApiConnection(tokenData.access_token, gitlabInstanceUrl);
          
          if (!connectionTest.success) {
            webhookSetupError = `GitLab API connection failed: ${connectionTest.error}`;
            console.error(`❌ ${webhookSetupError}`);
          } else {
            console.log(`✅ GitLab API connection successful`);
            console.log(`   - User: ${connectionTest.user?.username || 'Unknown'} (ID: ${connectionTest.user?.id || 'Unknown'})`);
            
            // Get user's GitLab projects to set up webhooks
            console.log(`🔍 Fetching GitLab projects...`);
            const projectsResponse = await fetch(`${gitlabInstanceUrl}/api/v4/projects?membership=true&per_page=100`, {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json',
              },
            });
            
            console.log(`📊 GitLab projects API response: ${projectsResponse.status} ${projectsResponse.statusText}`);
            
            if (projectsResponse.ok) {
              const projects = await projectsResponse.json() as Array<{
                id: number;
                path_with_namespace: string;
                web_url: string;
              }>;
              
              console.log(`📁 Found ${projects.length} GitLab projects for webhook setup`);
              
              if (projects.length === 0) {
                webhookSetupError = "No GitLab projects found. User might not have access to any projects or the OAuth scopes might be insufficient.";
                console.warn(`⚠️ ${webhookSetupError}`);
                console.warn("   - Required scopes: read_user, read_repository, read_api, api");
              }
              
              // Set up webhooks for each project
              let webhooksCreated = 0;
              let webhooksSkipped = 0;
              let webhooksFailed = 0;
              const failedProjects: string[] = [];
              
              for (const project of projects) {
                try {
                  console.log(`🔧 Setting up webhook for project: ${project.path_with_namespace} (ID: ${project.id})`);
                  
                  // Get detailed webhook setup info for debugging
                  const setupInfo = await getWebhookSetupInfo(
                    tokenData.access_token,
                    gitlabInstanceUrl,
                    project.id.toString(),
                    webhookUrl
                  );
                  
                  if (!setupInfo.projectAccess) {
                    console.warn(`⚠️ No access to project ${project.path_with_namespace}: ${setupInfo.error}`);
                    webhooksFailed++;
                    failedProjects.push(`${project.path_with_namespace} (no access)`);
                    continue;
                  }
                  
                  if (!setupInfo.canCreateWebhook) {
                    console.warn(`⚠️ Cannot create webhooks for project ${project.path_with_namespace} - insufficient permissions`);
                    webhooksFailed++;
                    failedProjects.push(`${project.path_with_namespace} (insufficient permissions)`);
                    continue;
                  }
                  
                  // Check if webhook already exists
                  const existingWebhook = setupInfo.existingWebhooks.find(webhook => webhook.url === webhookUrl);
                  
                  if (existingWebhook) {
                    console.log(`✅ Webhook already exists for project: ${project.path_with_namespace} (ID: ${existingWebhook.id})`);
                    webhooksSkipped++;
                  } else {
                    const webhook = await setupGitlabProjectWebhook({
                      accessToken: tokenData.access_token,
                      instanceUrl: gitlabInstanceUrl,
                      projectId: project.id.toString(),
                      webhookUrl,
                      webhookSecret,
                    });
                    console.log(`✅ Webhook configured for project: ${project.path_with_namespace} (Webhook ID: ${webhook.id})`);
                    webhooksCreated++;
                  }
                } catch (error) {
                  console.error(`❌ Failed to set up webhook for project ${project.path_with_namespace}:`, error);
                  webhooksFailed++;
                  failedProjects.push(`${project.path_with_namespace} (${error})`);
                  // Continue with other projects
                }
              }
              
              console.log(`📊 Webhook setup summary:`);
              console.log(`   - Created: ${webhooksCreated}`);
              console.log(`   - Skipped (already exist): ${webhooksSkipped}`);
              console.log(`   - Failed: ${webhooksFailed}`);
              console.log(`   - Total projects: ${projects.length}`);
              
              if (webhooksFailed > 0) {
                webhookSetupError = `Failed to set up webhooks for ${webhooksFailed} projects: ${failedProjects.join(", ")}`;
              }
              
            } else {
              const errorText = await projectsResponse.text();
              webhookSetupError = `Failed to fetch GitLab projects for webhook setup. Status: ${projectsResponse.status}, Error: ${errorText}`;
              console.error(`❌ ${webhookSetupError}`);
            }
          }
        }
      } catch (error) {
        webhookSetupError = `Failed to set up GitLab webhooks: ${error}`;
        console.error(`❌ ${webhookSetupError}`);
      }
      
      // Update integration with webhook setup error if any
      if (webhookSetupError) {
        await db
          .update(schema.gitlabIntegration)
          .set({
            syncError: webhookSetupError,
            syncErrorAt: new Date(),
          })
          .where(eq(schema.gitlabIntegration.id, newGitlabIntegration.id));
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

export const setupGitlabWebhooksHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof setupGitlabWebhooksContract
>(
  setupGitlabWebhooksContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, betterAuthUrl, gitlab }) => {
    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.organizationId, organization.id),
    });

    if (!integration) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "GitLab integration not found",
      });
    }

    if (!integration.accessToken) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "GitLab access token not available",
      });
    }

    const webhookUrl = `${betterAuthUrl}/integrations/gitlab/webhooks`;
    const webhookSecret = gitlab?.webhookSecret;

    if (!webhookSecret) {
      throw new TypedHandlersError({
        code: "SERVICE_UNAVAILABLE",
        message: "GitLab webhook secret not configured",
      });
    }

    let webhooksCreated = 0;
    const errors: string[] = [];

    try {
      // Get projects from the database
      const projects = await db.query.gitlabProject.findMany({
        where: eq(schema.gitlabProject.integrationId, integration.id),
      });

      console.log(`Setting up webhooks for ${projects.length} GitLab projects`);

      for (const project of projects) {
        try {
          // Check if webhook already exists
          const existingWebhook = await findWebhookByUrl(
            integration.accessToken,
            integration.gitlabInstanceUrl,
            project.projectId,
            webhookUrl
          );

          if (existingWebhook) {
            console.log(`✅ Webhook already exists for project: ${project.pathWithNamespace}`);
          } else {
            const webhook = await setupGitlabProjectWebhook({
              accessToken: integration.accessToken,
              instanceUrl: integration.gitlabInstanceUrl,
              projectId: project.projectId,
              webhookUrl,
              webhookSecret,
            });
            webhooksCreated++;
            console.log(`✅ Webhook configured for project: ${project.pathWithNamespace} (Webhook ID: ${webhook.id})`);
          }
        } catch (error) {
          const errorMessage = `Failed to set up webhook for project ${project.pathWithNamespace}: ${error}`;
          console.error(`❌ ${errorMessage}`);
          errors.push(errorMessage);
        }
      }

      // Update integration status based on webhook setup results
      if (errors.length > 0) {
        const errorMessage = `Failed to set up webhooks for some projects: ${errors.join(", ")}`;
        await db
          .update(schema.gitlabIntegration)
          .set({
            syncError: errorMessage,
            syncErrorAt: new Date(),
          })
          .where(eq(schema.gitlabIntegration.id, integration.id));
      }

      return { 
        success: errors.length === 0, 
        webhooksCreated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = `Failed to set up GitLab webhooks: ${error}`;
      console.error(`❌ ${errorMessage}`);
      
      // Update integration status with error
      await db
        .update(schema.gitlabIntegration)
        .set({
          syncError: errorMessage,
          syncErrorAt: new Date(),
        })
        .where(eq(schema.gitlabIntegration.id, integration.id));

      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: errorMessage,
      });
    }
  },
);
