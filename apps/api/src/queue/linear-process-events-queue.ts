import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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

      const summary = await generateLinearEventSummary({
        event,
        anthropicClient: new (await import("@anthropic-ai/sdk")).default({
          apiKey: env.ANTHROPIC_API_KEY,
        }),
      });

      if (summary) {
        const vectorId = nanoid();
        const voyageClient = new (await import("voyageai")).VoyageAIClient({
          apiKey: env.VOYAGE_API_KEY,
        });

        const embeddingResponse = await voyageClient.embed({
          input: summary,
          model: "voyage-3",
        });

        await db.insert(schema.linearEventVector).values({
          id: vectorId,
          eventId: event.id,
          embedding: embeddingResponse.data?.[0]?.embedding ?? [],
          content: summary,
          metadata: {
            type: event.type,
            action: event.action,
            issueId: event.issueId,
            projectId: event.projectId,
            userId: event.userId,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
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