import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { eq } from "drizzle-orm";
import { App } from "octokit";
import { VoyageAIClient } from "voyageai";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncEvents } from "./steps/fetch-and-sync-events";
import { fetchAndSyncRepositories } from "./steps/fetch-and-sync-repositories";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";

export type SyncGithubWorkflowParams = { integrationId: string; prefetchPastEvents?: boolean };

export class SyncGithubWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SyncGithubWorkflowParams
> {
  async run(event: WorkflowEvent<SyncGithubWorkflowParams>, step: WorkflowStep) {
    const { integrationId, prefetchPastEvents } = event.payload;
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

      if (!prefetchPastEvents) {
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
      }
    });

    await step.do("prefetch-past-events", async () => {
      if (!prefetchPastEvents) {
        return;
      }

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
      const openRouterProvider = createOpenRouter({ apiKey: this.env.OPENROUTER_API_KEY });
      const voyageClient = new VoyageAIClient({ apiKey: this.env.VOYAGE_API_KEY });

      const reportStatusFn = createReportStatusFn({ db, integrationId });

      await reportStatusFn(() =>
        fetchAndSyncEvents({
          octokit,
          db,
          integrationId,
          openRouterProvider,
          voyageClient,
          minEventCreatedAt: dayjs().startOf("week").toDate(),
        }),
      );

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
