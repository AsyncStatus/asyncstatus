import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getDiscordEventDetailTool(db: Db) {
  return tool({
    description: `Get detailed information about a specific Discord event by its ID, including payload data, message content, channel info, etc.`,
    parameters: z.object({
      eventId: z.string().describe("The Discord event ID to get details for"),
    }),
    execute: async (params) => {
      const eventDetail = await db
        .select({
          discordEvent: {
            id: schema.discordEvent.id,
            discordEventId: schema.discordEvent.discordEventId,
            type: schema.discordEvent.type,
            payload: schema.discordEvent.payload,
            messageId: schema.discordEvent.messageId,
            threadId: schema.discordEvent.threadId,
            createdAt: schema.discordEvent.createdAt,
          },
          discordEventVector: { embeddingText: schema.discordEventVector.embeddingText },
          discordServer: {
            name: schema.discordServer.name,
            guildId: schema.discordServer.guildId,
          },
          discordChannel: {
            name: schema.discordChannel.name,
            channelId: schema.discordChannel.channelId,
            type: schema.discordChannel.type,
          },
          discordUser: {
            username: schema.discordUser.username,
            globalName: schema.discordUser.globalName,
            discriminator: schema.discordUser.discriminator,
          },
        })
        .from(schema.discordEvent)
        .leftJoin(
          schema.discordEventVector,
          eq(schema.discordEvent.id, schema.discordEventVector.eventId),
        )
        .leftJoin(schema.discordServer, eq(schema.discordEvent.serverId, schema.discordServer.id))
        .leftJoin(
          schema.discordChannel,
          eq(schema.discordEvent.channelId, schema.discordChannel.channelId),
        )
        .leftJoin(
          schema.discordUser,
          eq(schema.discordEvent.discordUserId, schema.discordUser.discordUserId),
        )
        .where(eq(schema.discordEvent.id, params.eventId))
        .limit(1);
      return eventDetail[0] || null;
    },
  });
}
