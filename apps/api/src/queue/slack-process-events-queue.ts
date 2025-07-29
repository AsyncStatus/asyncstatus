import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateId } from "better-auth";
import { eq, sql } from "drizzle-orm";
import { VoyageAIClient } from "voyageai";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";
import { generateSlackEventSummary } from "../workflows/slack/steps/generate-slack-event-summary";

export type SlackProcessEventsQueueMessage = schema.SlackEvent["slackEventId"];

export async function slackProcessEventsQueue(
  batch: MessageBatch<SlackProcessEventsQueueMessage>,
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
