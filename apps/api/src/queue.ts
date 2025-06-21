import Anthropic from "@anthropic-ai/sdk";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";

import { createDb } from "./db";
import * as schema from "./db/schema";
import type { Bindings } from "./lib/env";
import type { AnyGithubWebhookEventDefinition } from "./lib/github-event-definition";
import { isTuple } from "./lib/is-tuple";
import { generateEventSummary } from "./workflows/github/steps/generate-event-summary";

export async function queue(
  batch: MessageBatch<AnyGithubWebhookEventDefinition | string>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  if (batch.queue === "github-webhook-events") {
    return githubWebhookEventsQueue(
      batch as MessageBatch<AnyGithubWebhookEventDefinition>,
      env,
      ctx,
    );
  }

  if (batch.queue === "github-process-events") {
    return githubProcessEventsQueue(batch as MessageBatch<string>, env, ctx);
  }

  throw new Error(`Unknown queue: ${batch.queue}`);
}

async function githubWebhookEventsQueue(
  batch: MessageBatch<AnyGithubWebhookEventDefinition>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const processedEventIds = new Set<string>();
  const batchUpserts = [];

  for (const message of batch.messages) {
    console.log(`Processing ${message.body.name} event`);
    processedEventIds.add(message.body.id.toString());
    message.ack();

    const event = message.body.payload;
    if (
      !("repository" in message.body.payload) ||
      !message.body.payload.repository
    ) {
      console.log("No repository found.");
      continue;
    }

    const repository = await db.query.githubRepository.findFirst({
      where: eq(
        schema.githubRepository.repoId,
        message.body.payload.repository.id.toString(),
      ),
      with: {
        integration: true,
      },
    });
    if (!repository) {
      console.log("No repository found.");
      continue;
    }

    if (!event.sender) {
      console.log("No sender found.");
      continue;
    }

    batchUpserts.push(
      db
        .insert(schema.githubEvent)
        .values({
          id: nanoid(),
          githubId: message.body.id.toString(),
          insertedAt: new Date(),
          createdAt:
            "created_at" in event ? new Date(event.created_at) : new Date(),
          repositoryId: repository.id,
          type: message.body.name,
          payload: event as AnyGithubWebhookEventDefinition,
          githubActorId: event.sender.id.toString(),
        })
        .onConflictDoUpdate({
          target: schema.githubEvent.githubId,
          setWhere: eq(schema.githubEvent.githubId, message.body.id.toString()),
          set: {
            insertedAt: new Date(),
            createdAt:
              "created_at" in event ? new Date(event.created_at) : new Date(),
            repositoryId: repository.id,
            type: message.body.name,
            payload: event as AnyGithubWebhookEventDefinition,
            githubActorId: event.sender.id.toString(),
          },
        }),
    );
  }

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }

  await env.GITHUB_PROCESS_EVENTS_QUEUE.sendBatch(
    Array.from(processedEventIds).map((id) => ({
      body: id,
      contentType: "text",
    })),
  );
}

async function githubProcessEventsQueue(
  batch: MessageBatch<string>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const anthropicClient = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });
  const voyageClient = new VoyageAIClient({
    apiKey: env.VOYAGE_API_KEY,
  });

  for (const message of batch.messages) {
    console.log(`Processing ${message.body} event`);

    const event = await db.query.githubEvent.findFirst({
      where: eq(schema.githubEvent.githubId, message.body),
    });
    if (!event) {
      console.log(`Event ${message.body} not found.`);
      message.ack();
      continue;
    }

    const { summary, embedding } = await generateEventSummary({
      anthropicClient,
      voyageClient,
      event,
    });
    if (!summary || !embedding) {
      console.log(`Failed to generate summary for event ${message.body}`);
      message.retry({ delaySeconds: 60 });
      continue;
    }

    await db.insert(schema.githubEventVector).values({
      id: nanoid(),
      eventId: event.id,
      embeddingText: summary,
      embedding: sql`vector32(${JSON.stringify(embedding)})`,
      createdAt: new Date(),
    });

    message.ack();
  }
}
