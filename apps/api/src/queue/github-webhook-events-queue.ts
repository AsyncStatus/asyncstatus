import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Bindings } from "../lib/env";
import type { AnyGithubWebhookEventDefinition } from "../lib/github-event-definition";
import { isTuple } from "../lib/is-tuple";

export type GithubWebhookEventsQueueMessage = AnyGithubWebhookEventDefinition;

export async function githubWebhookEventsQueue(
  batch: MessageBatch<GithubWebhookEventsQueueMessage>,
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
    if (!("repository" in message.body.payload) || !message.body.payload.repository) {
      console.log("No repository found.");
      continue;
    }

    const repository = await db.query.githubRepository.findFirst({
      where: eq(schema.githubRepository.repoId, message.body.payload.repository.id.toString()),
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
          createdAt: "created_at" in event ? new Date(event.created_at) : new Date(),
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
            createdAt: "created_at" in event ? new Date(event.created_at) : new Date(),
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
