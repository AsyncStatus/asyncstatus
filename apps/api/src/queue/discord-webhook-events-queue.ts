import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import * as schema from "../db";
import { createDb } from "../db/db";
import type { Bindings } from "../lib/env";

interface DiscordMessageEventData {
  id?: string;
  guild_id?: string;
  channel_id?: string;
  author?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  thread?: {
    id: string;
  };
}

export interface DiscordWebhookEvent {
  type: string; // Event type (e.g., "MESSAGE_CREATE", "MEMBER_ADD")
  timestamp: string; // ISO8601 timestamp
  data?: Record<string, unknown>; // Event-specific data
}

export type DiscordWebhookEventsQueueMessage = DiscordWebhookEvent;

export async function discordWebhookEventsQueue(
  batch: MessageBatch<DiscordWebhookEventsQueueMessage>,
  env: Bindings,
  _ctx: ExecutionContext,
) {
  const db = createDb(env);

  for (const message of batch.messages) {
    const event = message.body;

    if (!event || !event.type) {
      console.error("[DISCORD] Invalid event payload");
      message.ack();
      continue;
    }

    try {
      // Handle different Discord webhook event types
      const eventData = event.data || {};

      switch (event.type) {
        case "MESSAGE_CREATE":
        case "MESSAGE_UPDATE": {
          // Process message events
          const messageData = eventData as DiscordMessageEventData;
          const guildId = messageData.guild_id;

          if (!guildId) {
            console.error("[DISCORD] Missing guild_id in message event");
            message.ack();
            continue;
          }

          const server = await db.query.discordServer.findFirst({
            where: eq(schema.discordServer.guildId, guildId),
          });

          if (!server) {
            console.error(`[DISCORD] Server not found for guild ${guildId}`);
            message.ack();
            continue;
          }

          // Store the event
          await db.insert(schema.discordEvent).values({
            id: generateId(),
            serverId: server.id,
            discordEventId: messageData.id || generateId(),
            discordUserId: messageData.author?.id || null,
            channelId: messageData.channel_id || null,
            type: event.type,
            payload: eventData,
            messageId: messageData.id || null,
            threadId: messageData.thread?.id || null,
            createdAt: new Date(event.timestamp),
            insertedAt: new Date(),
          });

          console.log(`[DISCORD] Stored ${event.type} event`);
          break;
        }

        case "MEMBER_ADD":
        case "MEMBER_UPDATE":
        case "MEMBER_REMOVE": {
          // Handle member events
          console.log(`[DISCORD] Member event received: ${event.type}`, eventData);
          // TODO: Implement member event processing
          break;
        }

        default:
          console.log(`[DISCORD] Unhandled event type: ${event.type}`);
      }

      message.ack();
    } catch (error) {
      console.error("[DISCORD] Error processing event:", error);
      message.retry();
    }
  }
}
