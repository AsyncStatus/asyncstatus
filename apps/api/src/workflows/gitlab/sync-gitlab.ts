import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "../github/steps/common";
import { fetchAndSyncGitlabProjects } from "./steps/fetch-and-sync-projects";
import { fetchAndSyncGitlabUsers } from "./steps/fetch-and-sync-users";
import { fetchAndSyncGitlabEvents } from "./steps/fetch-and-sync-events";
import { setupGitlabProjectWebhook, listGitlabProjectWebhooks } from "../../lib/gitlab-webhook";

export type SyncGitlabWorkflowParams = { integrationId: string };

export class SyncGitlabWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncGitlabWorkflowParams
> {
  async run(event: WorkflowEvent<SyncGitlabWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    
    const integration = await db.query.gitlabIntegration.findFirst({
      where: eq(schema.gitlabIntegration.id, integrationId),
      with: { organization: true },
    });
    
    if (!integration) {
      throw new Error("GitLab integration not found");
    }

    if (!integration.accessToken) {
      throw new Error("GitLab access token not found");
    }

    await step.do("fetch-and-sync-projects", async () => {
      const db = createDb(this.env);
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => fetchAndSyncGitlabProjects({
        accessToken: integration.accessToken!,
        instanceUrl: integration.gitlabInstanceUrl,
        db,
        integrationId,
      }));
    });

    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(() => fetchAndSyncGitlabUsers({
        accessToken: integration.accessToken!,
        instanceUrl: integration.gitlabInstanceUrl,
        db,
        integrationId,
      }));
    });

    await step.do("prefetch-past-events", async () => {
      const db = createDb(this.env);
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        const eventIds = await fetchAndSyncGitlabEvents({
          accessToken: integration.accessToken!,
          instanceUrl: integration.gitlabInstanceUrl,
          db,
          integrationId,
          minEventCreatedAt: dayjs().startOf("week").toDate(),
        });

        if (eventIds.size > 0) {
          await this.env.GITLAB_PROCESS_EVENTS_QUEUE.sendBatch(
            Array.from(eventIds).map((id) => ({
              body: id,
              contentType: "text",
            })),
          );
        }
      });
    });

    await step.do("setup-webhooks-for-new-projects", async () => {
      const db = createDb(this.env);
      const integration = await db.query.gitlabIntegration.findFirst({
        where: eq(schema.gitlabIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        // Check for new projects that might not have webhooks set up
        const projects = await db.query.gitlabProject.findMany({
          where: eq(schema.gitlabProject.integrationId, integrationId),
        });

        if (projects.length > 0) {
          const webhookUrl = `${this.env.BETTER_AUTH_URL}/integrations/gitlab/webhooks`;
          const webhookSecret = this.env.GITLAB_WEBHOOK_SECRET;

          for (const project of projects) {
            try {
              // Check if webhook already exists for this project
              const existingWebhooks = await listGitlabProjectWebhooks(
                integration.accessToken!,
                integration.gitlabInstanceUrl,
                project.projectId
              );

              // Only set up webhook if none exists for our URL
              const hasWebhook = existingWebhooks.some(webhook => webhook.url === webhookUrl);
              
              if (!hasWebhook) {
                await setupGitlabProjectWebhook({
                  accessToken: integration.accessToken!,
                  instanceUrl: integration.gitlabInstanceUrl,
                  projectId: project.projectId,
                  webhookUrl,
                  webhookSecret,
                });
                console.log(`✅ Webhook configured for new project: ${project.pathWithNamespace}`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to check/set up webhook for project ${project.pathWithNamespace}:`, error);
              // Continue with other projects
            }
          }
        }
      });
    });

    await db
      .update(schema.gitlabIntegration)
      .set({
        syncFinishedAt: new Date(),
        syncUpdatedAt: new Date(),
      })
      .where(eq(schema.gitlabIntegration.id, integrationId));
  }
}
