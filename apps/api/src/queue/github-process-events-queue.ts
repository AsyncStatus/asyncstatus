import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";
import { generateGithubEventSummary } from "../workflows/github/steps/generate-github-event-summary";

export type GithubProcessEventsQueueMessage = schema.GithubEvent["githubId"];

export async function githubProcessEventsQueue(
  batch: MessageBatch<GithubProcessEventsQueueMessage>,
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
