import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { deleteGitlabProjectWebhook, listGitlabProjectWebhooks } from "../../lib/gitlab-webhook";
import { getGitlabWebhookUrl } from "../../lib/integrations-connect-url";

export type DeleteGitlabIntegrationWorkflowParams = {
  integrationId: string;
};

export class DeleteGitlabIntegrationWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  DeleteGitlabIntegrationWorkflowParams
> {
  async run(event: WorkflowEvent<DeleteGitlabIntegrationWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);

    const integration = await step.do("get-integration", async () => {
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.id, integrationId),
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      return integration;
    });

    await step.do("cleanup-webhooks", async () => {
      // Clean up webhooks from GitLab projects before deleting data
      if (integration.accessToken) {
        try {
          const projects = await db.query.gitlabProject.findMany({
            where: eq(schema.gitlabProject.integrationId, integrationId),
          });

          for (const project of projects) {
            try {
              // List existing webhooks for this project
              const webhooks = await listGitlabProjectWebhooks(
                integration.accessToken!,
                integration.gitlabInstanceUrl,
                project.projectId,
              );

              console.log(webhooks);
              for (const webhook of webhooks) {
                if (
                  webhook.url.startsWith(this.env.BETTER_AUTH_URL) ||
                  webhook.url.startsWith(
                    "https://rio-ecommerce-asylum-antarctica.trycloudflare.com",
                  )
                ) {
                  await deleteGitlabProjectWebhook(
                    integration.accessToken!,
                    integration.gitlabInstanceUrl,
                    project.projectId,
                    webhook.id,
                  );
                }
              }
            } catch (error) {
              // Log detailed error information for webhook cleanup
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.warn(
                `Failed to clean up webhooks for GitLab project ${project.pathWithNamespace}:`,
                {
                  projectId: project.projectId,
                  error: errorMessage,
                  integrationId,
                  instanceUrl: integration.gitlabInstanceUrl,
                },
              );
              // Continue with other projects as this is non-critical
            }
          }
        } catch (error) {
          // Log the overall webhook cleanup failure
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn("Failed to clean up GitLab webhooks:", {
            error: errorMessage,
            integrationId,
            instanceUrl: integration.gitlabInstanceUrl,
          });
          // Continue with deletion as webhook cleanup failure shouldn't block integration removal
        }
      }
    });

    await step.do("delete-integration-data", async () => {
      // Delete related data in order (respecting foreign key constraints)
      // GitLab event vectors (references gitlab_event)
      await db
        .delete(schema.gitlabEventVector)
        .where(
          eq(
            schema.gitlabEventVector.eventId,
            db
              .select({ id: schema.gitlabEvent.id })
              .from(schema.gitlabEvent)
              .innerJoin(
                schema.gitlabProject,
                eq(schema.gitlabEvent.projectId, schema.gitlabProject.id),
              )
              .where(eq(schema.gitlabProject.integrationId, integrationId)),
          ),
        );

      // GitLab events (references gitlab_project)
      await db
        .delete(schema.gitlabEvent)
        .where(
          eq(
            schema.gitlabEvent.projectId,
            db
              .select({ id: schema.gitlabProject.id })
              .from(schema.gitlabProject)
              .where(eq(schema.gitlabProject.integrationId, integrationId)),
          ),
        );

      // GitLab projects (references gitlab_integration)
      await db
        .delete(schema.gitlabProject)
        .where(eq(schema.gitlabProject.integrationId, integrationId));

      // GitLab users (references gitlab_integration)
      await db.delete(schema.gitlabUser).where(eq(schema.gitlabUser.integrationId, integrationId));

      // Finally, delete the integration itself
      await db
        .delete(schema.gitlabIntegration)
        .where(eq(schema.gitlabIntegration.id, integrationId));
    });
  }
}
