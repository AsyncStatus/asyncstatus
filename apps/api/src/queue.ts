import type { EmitterWebhookEvent } from "@octokit/webhooks";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { createDb } from "./db";
import * as schema from "./db/schema";
import type { Bindings } from "./lib/env";
import { isTuple } from "./lib/is-tuple";

export async function queue(
  batch: MessageBatch<EmitterWebhookEvent>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const batchUpserts = [];

  for (const message of batch.messages) {
    if (
      !("installation" in message.body.payload) ||
      !message.body.payload.installation
    ) {
      message.ack();
      console.log("No installation found.");
      continue;
    }

    const integration = await db.query.githubIntegration.findFirst({
      where: eq(
        schema.githubIntegration.installationId,
        message.body.payload.installation.id.toString(),
      ),
    });
    if (!integration) {
      message.ack();
      console.log("No integration found.");
      continue;
    }

    const event = message.body.payload;
    if (!("id" in event)) {
      message.ack();
      console.log("No event id found.");
      continue;
    }

    if (!("repository" in event)) {
      message.ack();
      console.log("No repository found.");
      continue;
    }

    const repository = await db.query.githubRepository.findFirst({
      where: eq(schema.githubRepository.repoId, event.repository.id.toString()),
    });
    if (!repository) {
      message.ack();
      console.log("No repository found.");
      continue;
    }

    if (
      !("actor" in event) ||
      !event.actor ||
      typeof event.actor !== "object" ||
      event.actor === null ||
      !("id" in event.actor) ||
      !event.actor.id
    ) {
      message.ack();
      console.log("No actor found.");
      continue;
    }

    batchUpserts.push(
      db
        .insert(schema.githubEvent)
        .values({
          id: nanoid(),
          githubId: event.id.toString(),
          insertedAt: new Date(),
          createdAt:
            "created_at" in event ? new Date(event.created_at) : new Date(),
          repositoryId: repository.id,
          type: message.body.name,
          payload: event,
          githubActorId: event.actor.id.toString(),
        })
        .onConflictDoUpdate({
          target: schema.githubEvent.githubId,
          setWhere: eq(schema.githubEvent.githubId, event.id.toString()),
          set: {
            insertedAt: new Date(),
            createdAt:
              "created_at" in event ? new Date(event.created_at) : new Date(),
            repositoryId: repository.id,
            type: message.body.name,
            payload: event,
            githubActorId: event.actor.id.toString(),
          },
        }),
    );
  }

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }
}
