import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { SlackEvent } from "@slack/web-api";
import { generateId } from "better-auth";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import * as schema from "./db";
import { createDb } from "./db/db";
import type { Bindings } from "./lib/env";
import type { AnyGithubWebhookEventDefinition } from "./lib/github-event-definition";
import { isTuple } from "./lib/is-tuple";
import { generateGithubEventSummary } from "./workflows/github/steps/generate-github-event-summary";
import { generateSlackEventSummary } from "./workflows/slack/steps/generate-slack-event-summary";

type ActualSlackEvent = { event: SlackEvent } & {
  token: string;
  team_id: string;
  api_app_id: string;
  event_context: string;
  event_id: string;
  event_time: number;
  is_ext_shared_channel: boolean;
  context_team_id: string;
  context_enterprise_id: string | null;
};

export async function queue(
  batch: MessageBatch<AnyGithubWebhookEventDefinition | ActualSlackEvent | string>,
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

  if (batch.queue === "slack-webhook-events") {
    return slackWebhookEventsQueue(batch as MessageBatch<ActualSlackEvent>, env, ctx);
  }

  if (batch.queue === "slack-process-events") {
    return slackProcessEventsQueue(batch as MessageBatch<string>, env, ctx);
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

async function githubProcessEventsQueue(
  batch: MessageBatch<string>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const openRouterProvider = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
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

    const { summary, embedding } = await generateGithubEventSummary({
      openRouterProvider,
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

async function slackWebhookEventsQueue(
  batch: MessageBatch<ActualSlackEvent>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const processedEventIds = new Set<string>();
  const batchUpserts = [];
  for (const message of batch.messages) {
    console.log(`Processing ${message.body.event.type} event`);
    processedEventIds.add(message.body.event_id);
    message.ack();

    const eventType = "type" in message.body.event ? message.body.event.type : "unknown";
    const slackTeamId = "team_id" in message.body ? message.body.team_id : "unknown";
    const slackUserId = "user" in message.body.event ? message.body.event.user : null;
    const channelId = "channel" in message.body.event ? message.body.event.channel : null;
    const messageTs = "event_ts" in message.body.event ? message.body.event.event_ts : null;
    const threadTs = "thread_ts" in message.body.event ? message.body.event.thread_ts : null;
    const createdAt = "event_time" in message.body ? new Date() : new Date();

    const slackIntegration = await db.query.slackIntegration.findFirst({
      where: eq(schema.slackIntegration.teamId, slackTeamId),
    });
    if (!slackIntegration) {
      console.log(`Team ${slackTeamId} not found.`);
      continue;
    }

    batchUpserts.push(
      db.insert(schema.slackEvent).values({
        id: generateId(),
        slackTeamId,
        slackEventId: message.body.event_id,
        type: eventType,
        channelId,
        slackUserId,
        messageTs,
        threadTs,
        payload: message.body.event,
        createdAt,
        insertedAt: new Date(),
      } as any),
    );
  }

  if (isTuple(batchUpserts)) {
    await db.batch(batchUpserts);
  }

  await env.SLACK_PROCESS_EVENTS_QUEUE.sendBatch(
    Array.from(processedEventIds).map((id) => ({
      body: id,
      contentType: "text",
    })),
  );
}

async function slackProcessEventsQueue(
  batch: MessageBatch<string>,
  env: Bindings,
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const openRouterProvider = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  const voyageClient = new VoyageAIClient({
    apiKey: env.VOYAGE_API_KEY,
  });

  for (const message of batch.messages) {
    console.log(`Processing ${message.body} event`);

    const event = await db.query.slackEvent.findFirst({
      where: eq(schema.slackEvent.slackEventId, message.body),
    });
    if (!event) {
      console.log(`Event ${message.body} not found.`);
      message.ack();
      continue;
    }

    const { summary, embedding } = await generateSlackEventSummary({
      openRouterProvider,
      voyageClient,
      event,
    });
    if (!summary || !embedding) {
      console.log(`Failed to generate summary for event ${message.body}`);
      message.retry({ delaySeconds: 60 });
      continue;
    }

    await db.insert(schema.slackEventVector).values({
      id: generateId(),
      eventId: event.id,
      embeddingText: summary,
      embedding: sql`vector32(${JSON.stringify(embedding)})`,
      createdAt: new Date(),
    });

    message.ack();
  }
}
