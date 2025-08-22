import { eq } from "drizzle-orm";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { HonoEnv } from "../lib/env";
import { generateTeamsEventSummary } from "../workflows/teams/steps/generate-teams-event-summary";

export async function teamsProcessEventsQueue(
  batch: MessageBatch<string>,
  env: HonoEnv["Bindings"],
) {
  const db = createDb(env);

  for (const message of batch.messages) {
    try {
      const eventId = message.body;
      
      // Generate summary for the event
      await generateTeamsEventSummary({
        db,
        eventId,
      });

      // Mark message as processed
      message.ack();
    } catch (error) {
      console.error(`Failed to process Teams event ${message.body}:`, error);
      // Retry the message
      message.retry();
    }
  }
}