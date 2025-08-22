import { eq } from "drizzle-orm";
import { generateId } from "better-auth";
import { createDb } from "../db/db";
import * as schema from "../db";
import type { HonoEnv } from "../lib/env";

export interface FigmaWebhookEvent {
  id: string;
  type: string;
  webhook_id: string;
  passcode: string;
  timestamp: string;
  file_key?: string;
  file_name?: string;
  triggered_by?: {
    id: string;
    handle: string;
  };
  description?: string;
  comment?: any;
  comment_id?: string;
  version_id?: string;
  label?: string;
  created_components?: any[];
  modified_components?: any[];
  deleted_components?: any[];
}

export async function handleFigmaWebhookEvent(
  batch: MessageBatch<FigmaWebhookEvent>,
  env: HonoEnv["Bindings"]
): Promise<void> {
  const db = createDb(env);
  const eventIdsToProcess: string[] = [];

  for (const message of batch.messages) {
    try {
      const event = message.body;

      // Find the integration by webhook passcode
      const integration = await db.query.figmaIntegration.findFirst({
        where: eq(schema.figmaIntegration.webhookSecret, event.passcode),
      });

      if (!integration) {
        console.error(`Integration not found for passcode: ${event.passcode}`);
        message.ack();
        continue;
      }

      // Find the file if file_key is provided
      let fileId: string | null = null;
      if (event.file_key) {
        const file = await db.query.figmaFile.findFirst({
          where: eq(schema.figmaFile.fileKey, event.file_key),
        });
        if (file) {
          fileId = file.id;
        } else {
          // File not found, might be a new file not yet synced
          console.log(`File not found for key: ${event.file_key}, will sync on next run`);
        }
      }

      // Store the event
      const eventId = generateId();
      const figmaEventId = `${event.webhook_id}_${event.timestamp}`;

      await db
        .insert(schema.figmaEvent)
        .values({
          id: eventId,
          figmaId: figmaEventId,
          figmaUserId: event.triggered_by?.id || null,
          fileId,
          type: event.type,
          payload: event as any,
          webhookId: event.webhook_id,
          passcode: event.passcode,
          timestamp: event.timestamp,
          createdAt: new Date(event.timestamp),
          insertedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.figmaEvent.figmaId,
          set: {
            payload: event as any,
          },
        });

      // Queue for AI processing if it's a meaningful event
      if (event.type === "FILE_UPDATE" || event.type === "FILE_VERSION_UPDATE" || event.type === "COMMENT") {
        eventIdsToProcess.push(eventId);
      }

      // Also sync the user if provided
      if (event.triggered_by) {
        await db
          .insert(schema.figmaUser)
          .values({
            id: generateId(),
            integrationId: integration.id,
            figmaId: event.triggered_by.id,
            handle: event.triggered_by.handle,
            email: null,
            imgUrl: null,
            name: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.figmaUser.figmaId,
            set: {
              handle: event.triggered_by.handle,
              updatedAt: new Date(),
            },
          });
      }

      message.ack();
    } catch (error) {
      console.error("Error processing Figma webhook event:", error);
      message.retry();
    }
  }

  // Send events for AI processing
  if (eventIdsToProcess.length > 0) {
    await env.FIGMA_PROCESS_EVENTS_QUEUE.sendBatch(
      eventIdsToProcess.map((id) => ({
        body: id,
        contentType: "text",
      }))
    );
  }
}