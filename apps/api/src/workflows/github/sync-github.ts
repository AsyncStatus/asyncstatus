import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { eq } from "drizzle-orm";
import { App } from "octokit";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncEvents } from "./steps/fetch-and-sync-events";
import { fetchAndSyncRepositories } from "./steps/fetch-and-sync-repositories";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncGithubWorkflowParams = { integrationId: string };

export class SyncGithubWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncGithubWorkflowParams
> {
  async run(event: WorkflowEvent<SyncGithubWorkflowParams>, step: WorkflowStep) {
    const { integrationId } = event.payload;
    const db = createDb(this.env);
    const integration = await db.query.githubIntegration.findFirst({
      where: eq(schema.githubIntegration.id, integrationId),
      with: { organization: true },
    });
    if (!integration) {
      throw new Error("Integration not found");
    }

    await step.do("fetch-and-sync-repositories", async () => {
      const db = createDb(this.env);
      const integration = await db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });
      const octokit = await app.getInstallationOctokit(Number(integration.installationId));

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(() => fetchAndSyncRepositories({ octokit, db, integrationId }));
    });

    await step.do("fetch-and-sync-users", async () => {
      const db = createDb(this.env);
      const integration = await db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });
      const octokit = await app.getInstallationOctokit(Number(integration.installationId));

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(() => fetchAndSyncUsers({ octokit, db, integrationId }));
    });

    await step.do("prefetch-past-events", async () => {
      const db = createDb(this.env);
      const integration = await db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const app = new App({
        appId: this.env.GITHUB_APP_ID,
        privateKey: this.env.GITHUB_APP_PRIVATE_KEY,
      });
      const octokit = await app.getInstallationOctokit(Number(integration.installationId));

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(async () => {
        const eventIds = await fetchAndSyncEvents({
          octokit,
          db,
          integrationId,
          minEventCreatedAt: dayjs().startOf("week").toDate(),
        });

        await this.env.GITHUB_PROCESS_EVENTS_QUEUE.sendBatch(
          Array.from(eventIds).map((id) => ({
            body: id,
            contentType: "text",
          })),
        );
      });

      await db
        .update(schema.githubIntegration)
        .set({
          syncFinishedAt: new Date(),
          syncId: null,
          syncError: null,
          syncErrorAt: null,
          syncStartedAt: null,
        })
        .where(eq(schema.githubIntegration.id, integrationId));
    });
  }
}
