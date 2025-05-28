import { Anthropic } from "@anthropic-ai/sdk";
import {
  WorkflowEntrypoint,
  WorkflowStep,
  type WorkflowEvent,
} from "cloudflare:workers";
import { subDays } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { App } from "octokit";
import { VoyageAIClient } from "voyageai";

import { createDb } from "../../db";
import * as schema from "../../db/schema";
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
  async run(
    event: WorkflowEvent<SyncGithubWorkflowParams>,
    step: WorkflowStep,
  ) {
    const { integrationId } = event.payload;
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
    const octokit = await app.getInstallationOctokit(
      Number(integration.installationId),
    );
    const reportStatusFn = createReportStatusFn({ db, integrationId });

    await step.do(
      SyncGithubWorkflowStatusName.fetchAndSyncRepositories,
      reportStatusFn(
        SyncGithubWorkflowStatusName.fetchAndSyncRepositories,
        () => fetchAndSyncRepositories({ octokit, db, integrationId }),
      ),
    );

    await step.do(
      SyncGithubWorkflowStatusName.fetchAndSyncUsers,
      reportStatusFn(SyncGithubWorkflowStatusName.fetchAndSyncUsers, () =>
        fetchAndSyncUsers({ octokit, db, integrationId }),
      ),
    );

    await step.do(
      SyncGithubWorkflowStatusName.fetchAndSyncEvents,
      reportStatusFn(SyncGithubWorkflowStatusName.fetchAndSyncEvents, () =>
        fetchAndSyncEvents({
          octokit,
          db,
          integrationId,
          maxEventDate: subDays(new Date(), 7),
        }),
      ),
    );

    await step.do(
      SyncGithubWorkflowStatusName.processEvents,
      reportStatusFn(SyncGithubWorkflowStatusName.processEvents, async () => {
        const anthropicClient = new Anthropic({
          apiKey: this.env.ANTHROPIC_API_KEY,
        });
        const voyageClient = new VoyageAIClient({
          apiKey: this.env.VOYAGE_API_KEY,
        });

        const repositories = await db.query.githubRepository.findMany({
          where: eq(schema.githubRepository.integrationId, integrationId),
          with: { events: true },
        });

        for (const repository of repositories) {
          await step.do(
            `${SyncGithubWorkflowStatusName.processEvents}_${repository.id}`,
            async () => {
              let vectorsToCreate: (typeof schema.githubEventVector.$inferInsert)[] =
                [];

              for (let i = 0; i < repository.events.length; i++) {
                const event = repository.events[i]!;
                const { embedding, summary } = await generateEventSummary({
                  anthropicClient,
                  voyageClient,
                  event,
                });
                if (!embedding || !summary) {
                  console.log(`Failed to process event ${event.id}. Skipping.`);
                  return;
                }

                vectorsToCreate.push({
                  id: nanoid(),
                  eventId: event.id,
                  embeddingText: summary,
                  embedding,
                  createdAt: new Date(),
                });

                if (
                  vectorsToCreate.length >= 100 ||
                  i === repository.events.length - 1
                ) {
                  const upserts = vectorsToCreate.map((item) =>
                    db
                      .insert(schema.githubEventVector)
                      .values(item)
                      .onConflictDoUpdate({
                        target: schema.githubEventVector.eventId,
                        setWhere: eq(
                          schema.githubEventVector.eventId,
                          item.eventId,
                        ),
                        set: {
                          id: item.id,
                          embeddingText: item.embeddingText,
                          embedding: sql`vector32(${JSON.stringify(item.embedding)})`,
                          createdAt: new Date(),
                        },
                      }),
                  );

                  await db.batch(upserts as any);
                  vectorsToCreate = [];
                }
              }
            },
          );
        }
      }),
    );
  }
}
