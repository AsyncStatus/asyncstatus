import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { VoyageAIClient } from "voyageai";
import { createDb } from "../db/db";
import type { HonoEnv } from "../lib/env";
import { generateFigmaEventSummary } from "../workflows/figma/steps/generate-figma-event-summary";

export async function handleFigmaProcessEvent(
  batch: MessageBatch<string>,
  env: HonoEnv["Bindings"]
): Promise<void> {
  const db = createDb(env);
  const openRouterProvider = createOpenRouter({ apiKey: env.OPENROUTER_API_KEY });
  const voyageClient = new VoyageAIClient({ apiKey: env.VOYAGE_API_KEY });

  for (const message of batch.messages) {
    try {
      const eventId = message.body;

      await generateFigmaEventSummary({
        eventId,
        db,
        openRouterProvider,
        voyageClient,
      });

      message.ack();
    } catch (error) {
      console.error(`Error processing Figma event ${message.body}:`, error);
      
      // Retry a few times before giving up
      if (message.attempts < 3) {
        message.retry();
      } else {
        console.error(`Failed to process Figma event ${message.body} after 3 attempts`);
        message.ack();
      }
    }
  }
}