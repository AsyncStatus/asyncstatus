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
          const discordEventId = messageData.id || generateId();
          await db.insert(schema.discordEvent).values({
            id: generateId(),
            serverId: server.id,
            discordEventId,
            discordUserId: messageData.author?.id || null,
            channelId: messageData.channel_id || null,
            type: event.type,
            payload: eventData,
            messageId: messageData.id || null,
            threadId: messageData.thread?.id || null,
            createdAt: new Date(event.timestamp),
            insertedAt: new Date(),
          });

          // Send to Discord process events queue for AI processing
          await env.DISCORD_PROCESS_EVENTS_QUEUE.send(discordEventId, {
            contentType: "text",
          });

          console.log(`[DISCORD] Stored ${event.type} event and queued for processing`);
          break;
        }

        case "APPLICATION_AUTHORIZED": {
          // Handle application authorization - start Discord Gateway
          console.log(`[DISCORD] Application authorized, starting Discord Gateway`, eventData);

          const guildId = (eventData as any)?.guild?.id;
          if (guildId) {
            // Find the server and its integration
            const server = await db.query.discordServer.findFirst({
              where: eq(schema.discordServer.guildId, guildId),
              with: {
                integration: true,
              },
            });

            if (server?.integration) {
              try {
                // Get or create Durable Object ID for this integration
                let durableObjectId = server.integration.gatewayDurableObjectId;
                if (!durableObjectId) {
                  durableObjectId = crypto.randomUUID();
                  await db
                    .update(schema.discordIntegration)
                    .set({ gatewayDurableObjectId: durableObjectId })
                    .where(eq(schema.discordIntegration.id, server.integration.id));
                }

                // Start the Discord Gateway
                const durableObject = env.DISCORD_GATEWAY_DO.get(
                  env.DISCORD_GATEWAY_DO.idFromName(durableObjectId),
                );
                const result = await durableObject.startGateway(server.integration.id);

                if (result.success) {
                  console.log(
                    `[DISCORD] Successfully started Gateway for guild ${guildId}: ${result.message}`,
                  );
                } else {
                  console.error(
                    `[DISCORD] Failed to start Gateway for guild ${guildId}: ${result.message}`,
                  );
                }
              } catch (error) {
                console.error(`[DISCORD] Error starting Gateway for guild ${guildId}:`, error);
              }
            } else {
              console.error(`[DISCORD] No Discord integration found for guild ${guildId}`);
            }
          }
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
