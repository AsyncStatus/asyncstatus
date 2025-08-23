import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { VoyageAIClient } from "voyageai";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { HonoEnv } from "../lib/env";
import { generateLinearEventSummary } from "../workflows/linear/steps/generate-linear-event-summary";

export async function linearProcessEventsQueue(
  batch: MessageBatch<string>,
  env: HonoEnv["Bindings"],
): Promise<void> {
  const db = createDb(env);

  for (const message of batch.messages) {
    try {
      const eventId = message.body;

      const event = await db.query.linearEvent.findFirst({
        where: eq(schema.linearEvent.id, eventId),
      });

      if (!event) {
        console.warn(`Linear event ${eventId} not found`);
        message.ack();
        continue;
      }

      if (event.processed) {
        message.ack();
        continue;
      }

      const openRouterProvider = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
      const voyageClient = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });

      const { summary, embedding } = await generateLinearEventSummary({
        event,
        openRouterProvider,
        voyageClient,
      });

      if (summary && embedding) {
        await db.insert(schema.linearEventVector).values({
          id: nanoid(),
          eventId: event.id,
          embeddingText: summary,
          embedding: sql`vector32(${JSON.stringify(embedding)})`,
          createdAt: new Date(),
        });
      }

      await db
        .update(schema.linearEvent)
        .set({
          processed: true,
          processedAt: new Date(),
          summary,
          summaryCreatedAt: summary ? new Date() : null,
        })
        .where(eq(schema.linearEvent.id, event.id));

      message.ack();
    } catch (error) {
      console.error(`Error processing Linear event ${message.body}:`, error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await db
        .update(schema.linearEvent)
        .set({
          summaryError: errorMessage,
        })
        .where(eq(schema.linearEvent.id, message.body));

      message.retry();
    }
  }
}
