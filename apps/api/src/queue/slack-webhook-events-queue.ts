import type { SlackEvent } from "@slack/web-api";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";
import { isTuple } from "../lib/is-tuple";

export type SlackWebhookEventsQueueMessage = { event: SlackEvent } & {
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

export async function slackWebhookEventsQueue(
  batch: MessageBatch<SlackWebhookEventsQueueMessage>,
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
    const createdAt =
      "event_time" in message.body ? new Date(message.body.event_time * 1000) : new Date();

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
