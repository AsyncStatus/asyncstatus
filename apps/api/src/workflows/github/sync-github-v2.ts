import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { Anthropic } from "@anthropic-ai/sdk";
import { subDays } from "date-fns";
import { asc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { App } from "octokit";
import { VoyageAIClient } from "voyageai";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";
import { SyncGithubWorkflowStatusName } from "../../schema/github-integration";
import { createReportStatusFn } from "./steps/common";
import { fetchAndSyncEvents } from "./steps/fetch-and-sync-events";
import { fetchAndSyncRepositories } from "./steps/fetch-and-sync-repositories";
import { fetchAndSyncUsers } from "./steps/fetch-and-sync-users";
import { generateEventSummary } from "./steps/generate-event-summary";

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

    await step.do(SyncGithubWorkflowStatusName.fetchAndSyncRepositories, async () => {
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

      return await reportStatusFn(SyncGithubWorkflowStatusName.fetchAndSyncRepositories, () =>
        fetchAndSyncRepositories({ octokit, db, integrationId }),
      );
    });

    await step.do(SyncGithubWorkflowStatusName.fetchAndSyncUsers, async () => {
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

      return await reportStatusFn(SyncGithubWorkflowStatusName.fetchAndSyncUsers, () =>
        fetchAndSyncUsers({ octokit, db, integrationId }),
      );
    });

    await step.do(SyncGithubWorkflowStatusName.fetchAndSyncEvents, async () => {
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

      return await reportStatusFn(SyncGithubWorkflowStatusName.fetchAndSyncEvents, () =>
        fetchAndSyncEvents({
          octokit,
          db,
          integrationId,
          maxEventDate: subDays(new Date(), 120),
        }),
      );
    });

    await step.do(SyncGithubWorkflowStatusName.processEvents, async () => {
      const db = createDb(this.env);
      const integration = await db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.id, integrationId),
        with: { organization: true },
      });
      if (!integration) {
        throw new Error("Integration not found");
      }
      const anthropicClient = new Anthropic({
        apiKey: this.env.ANTHROPIC_API_KEY,
      });
      const voyageClient = new VoyageAIClient({
        apiKey: this.env.VOYAGE_API_KEY,
      });
      const reportStatusFn = createReportStatusFn({ db, integrationId });

      return await reportStatusFn(SyncGithubWorkflowStatusName.processEvents, async () => {
        const repositories = await db.query.githubRepository.findMany({
          where: eq(schema.githubRepository.integrationId, integrationId),
          with: { events: true },
          orderBy: asc(schema.githubEvent.createdAt),
        });
        const hasAnyEvents = repositories.some((repository) => repository.events.length > 0);
        if (!hasAnyEvents) {
          console.log("No events found. Skipping.");
          return;
        }

        for (const repository of repositories) {
          if (repository.events.length === 0) {
            console.log(
              `No events found for repository ${repository.name} (${repository.id}). Skipping.`,
            );
            continue;
          }

          console.log(
            `Processing repository ${repository.name} (${repository.id}), ${repository.events.length} events`,
          );

          for (let i = 0; i < repository.events.length; i++) {
            const event = repository.events[i]!;
            console.log(
              `Processing event ${event.id} ${event.type}, ${i} of ${repository.events.length}`,
            );
            const { embedding, summary } = await generateEventSummary({
              anthropicClient,
              voyageClient,
              event,
            });
            if (!embedding || !summary) {
              console.log(`Failed to process event ${event.id}. Skipping.`);
              return;
            }

            await db.insert(schema.githubEventVector).values({
              id: nanoid(),
              eventId: event.id,
              embeddingText: summary,
              embedding: sql`vector32(${JSON.stringify(embedding)})`,
              createdAt: new Date(),
            });
          }
        }

        await db
          .update(schema.githubIntegration)
          .set({
            syncFinishedAt: new Date(),
            syncId: null,
            syncError: null,
            syncErrorAt: null,
            syncStatusName: null,
            syncStatusStep: null,
            syncStatusUpdatedAt: null,
            syncStartedAt: null,
          })
          .where(eq(schema.githubIntegration.id, integrationId));
      });
    });
  }
}
