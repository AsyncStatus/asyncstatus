import type { OpenRouterProvider } from "@openrouter/ai-sdk-provider";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import type { VoyageAIClient } from "voyageai";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import type { AnyGithubWebhookEventDefinition } from "../../../lib/github-event-definition";
import { isTuple } from "../../../lib/is-tuple";
import { standardizeGithubEventName } from "../../../lib/standardize-github-event-name";
import { generateGithubEventSummary } from "./generate-github-event-summary";

type FetchAndSyncEventsParams = {
  octokit: Octokit;
  db: Db;
  integrationId: string;
  openRouterProvider: OpenRouterProvider;
  voyageClient: VoyageAIClient;
  minEventCreatedAt: Date;
};

export async function fetchAndSyncEvents({
  octokit,
  db,
  integrationId,
  openRouterProvider,
  voyageClient,
  minEventCreatedAt,
}: FetchAndSyncEventsParams) {
  const repositories = await db.query.githubRepository.findMany({
    where: eq(schema.githubRepository.integrationId, integrationId),
    columns: { id: true, owner: true, name: true },
  });

  for (const repo of repositories) {
    const events = await octokit.paginate(
      "GET /repos/{owner}/{repo}/events",
      { owner: repo.owner, repo: repo.name, per_page: 100 },
      (response, done) => {
        if (response.data.length === 0) {
          done();
          return [];
        }

        const filteredEvents = response.data.filter((event) => {
          if (!event.created_at) {
            return true;
          }
          return new Date(event.created_at) > minEventCreatedAt;
        });
        if (filteredEvents.length !== response.data.length) {
          done();
        }

        return filteredEvents;
      },
    );

    if (events.length === 0) {
      continue;
    }

    try {
      const batchUpserts = events.map((event) => {
        return db
          .insert(schema.githubEvent)
          .values({
            id: nanoid(),
            githubId: event.id.toString(),
            githubActorId: event.actor.id.toString(),
            insertedAt: new Date(),
            createdAt: event.created_at ? new Date(event.created_at) : new Date(),
            repositoryId: repo.id,
            type: standardizeGithubEventName(event.type ?? "UnknownEvent"),
            payload: event.payload as AnyGithubWebhookEventDefinition,
          })
          .onConflictDoUpdate({
            target: schema.githubEvent.githubId,
            setWhere: eq(schema.githubEvent.githubId, event.id.toString()),
            set: {
              insertedAt: new Date(),
              createdAt: event.created_at ? new Date(event.created_at) : new Date(),
              repositoryId: repo.id,
              type: standardizeGithubEventName(event.type ?? "UnknownEvent"),
              githubActorId: event.actor.id.toString(),
              payload: event.payload as AnyGithubWebhookEventDefinition,
            },
          });
      });
      if (isTuple(batchUpserts)) {
        await db.batch(batchUpserts);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const events = await db.query.githubEvent.findMany({
    where: inArray(
      schema.githubEvent.repositoryId,
      repositories.map((repo) => repo.id),
    ),
    orderBy: desc(schema.githubEvent.createdAt),
  });
  const batches = groupBatch(events, 50);
  for (const batch of batches) {
    const summarizedEvents = await Promise.all(
      batch.map(async (event) => {
        const { summary, embedding } = await generateGithubEventSummary({
          openRouterProvider,
          voyageClient,
          event,
        });
        return { id: event.id, summary, embedding };
      }),
    );

    const batchUpserts = summarizedEvents.map((eventSummary) => {
      if (!eventSummary.embedding || !eventSummary.summary) {
        return null;
      }

      return db.insert(schema.githubEventVector).values({
        id: nanoid(),
        eventId: eventSummary.id,
        embeddingText: eventSummary.summary,
        embedding: sql`vector32(${JSON.stringify(eventSummary.embedding)})`,
        createdAt: new Date(),
      });
    });

    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts as any);
    }
  }
}

function groupBatch<T>(batch: T[], batchSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < batch.length; i += batchSize) {
    result.push(batch.slice(i, i + batchSize));
  }
  return result;
}
