import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { generateId } from "better-auth";
import { eq, inArray } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";

export type FetchDiscordMessagesWorkflowParams = {
  integrationId: string;
  channelId?: string;
  limit?: number;
  before?: string;
  after?: string;
};

export class FetchDiscordMessagesWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  FetchDiscordMessagesWorkflowParams
> {
  async run(event: WorkflowEvent<FetchDiscordMessagesWorkflowParams>, step: WorkflowStep) {
    const { integrationId, channelId, limit = 50, before, after } = event.payload;

    const db = createDb(this.env);
    const integration = await db.query.discordIntegration.findFirst({
      where: eq(schema.discordIntegration.id, integrationId),
      with: {
        organization: true,
        servers: {
          with: {
            channels: true,
          },
        },
      },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Step 1: Fetch messages from Discord API
    const fetchResult = await step.do("fetch-messages-from-discord", async () => {
      const messages: any[] = [];
      const channelsToFetch = channelId
        ? [channelId]
        : integration.servers.flatMap((server) =>
            server.channels.map((channel) => channel.channelId),
          );

      for (const currentChannelId of channelsToFetch) {
        try {
          const queryParams = new URLSearchParams({
            limit: limit.toString(),
          });

          if (before) queryParams.append("before", before);
          if (after) queryParams.append("after", after);

          const response = await fetch(
            `https://discord.com/api/v10/channels/${currentChannelId}/messages?${queryParams}`,
            {
              headers: {
                Authorization: `Bot ${integration.botAccessToken}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            console.error(
              `Failed to fetch messages from channel ${currentChannelId}: ${response.status} ${response.statusText}`,
            );
            continue;
          }

          const channelMessages = (await response.json()) as any[];
          messages.push(...channelMessages);
        } catch (error) {
          console.error(`Error fetching messages from channel ${currentChannelId}:`, error);
        }
      }

      return {
        messages: messages,
        count: messages.length,
      };
    });

    // Step 2: Store messages in database
    const storeResult = await step.do("store-messages", async () => {
      const db = createDb(this.env);
      let storedCount = 0;
      const eventIds: string[] = [];

      for (const message of fetchResult.messages) {
        try {
          // Find the server for this channel
          const server = integration.servers.find((s) =>
            s.channels.some((c) => c.channelId === message.channel_id),
          );

          if (!server) {
            console.warn(`No server found for channel ${message.channel_id}`);
            continue;
          }

          const discordEventId = `message_${message.id}`;

          // Store the message as a Discord event
          await db
            .insert(schema.discordEvent)
            .values({
              id: generateId(),
              serverId: server.id,
              discordEventId,
              discordUserId: message.author.id,
              channelId: message.channel_id,
              type: "MESSAGE_CREATE",
              payload: message,
              messageId: message.id,
              threadId: message.thread?.id || null,
              createdAt: new Date(message.timestamp),
              insertedAt: new Date(),
            })
            .onConflictDoNothing();

          eventIds.push(discordEventId);
          storedCount++;
        } catch (error) {
          console.error(`Error storing message ${message.id}:`, error);
        }
      }

      return { storedCount, eventIds };
    });

    // Step 3: Send unprocessed events to processing queue
    await step.do("send-events-to-queue", async () => {
      console.log(`Checking which of ${storeResult.eventIds.length} events need processing...`);

      if (storeResult.eventIds.length === 0) {
        return { processed: true, messageCount: 0, skipped: 0 };
      }

      const db = createDb(this.env);

      // Find the database IDs for these Discord event IDs
      const discordEvents = await db.query.discordEvent.findMany({
        where: inArray(schema.discordEvent.discordEventId, storeResult.eventIds),
        columns: { id: true, discordEventId: true },
      });

      if (discordEvents.length === 0) {
        console.log("No events found in database, nothing to process");
        return { processed: true, messageCount: 0, skipped: 0 };
      }

      // Check which events already have vectors (are already processed)
      const processedEventIds = await db
        .select({ eventId: schema.discordEventVector.eventId })
        .from(schema.discordEventVector)
        .where(
          inArray(
            schema.discordEventVector.eventId,
            discordEvents.map((e) => e.id),
          ),
        );

      const processedSet = new Set(processedEventIds.map((e) => e.eventId));

      // Filter to only unprocessed events
      const unprocessedEvents = discordEvents.filter((event) => !processedSet.has(event.id));
      const unprocessedDiscordEventIds = unprocessedEvents.map((event) => event.discordEventId);

      console.log(
        `Found ${unprocessedDiscordEventIds.length} unprocessed events out of ${storeResult.eventIds.length} total`,
      );

      if (unprocessedDiscordEventIds.length > 0) {
        await this.env.DISCORD_PROCESS_EVENTS_QUEUE.sendBatch(
          unprocessedDiscordEventIds.map((eventId) => ({ body: eventId })),
        );
      }

      return {
        processed: true,
        messageCount: unprocessedDiscordEventIds.length,
        skipped: storeResult.eventIds.length - unprocessedDiscordEventIds.length,
      };
    });

    return {
      success: true,
      messagesFetched: fetchResult.count,
      messagesStored: storeResult.storedCount,
    };
  }
}
