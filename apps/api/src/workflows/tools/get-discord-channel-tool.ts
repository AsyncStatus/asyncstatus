import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getDiscordChannelTool(db: Db) {
  return tool({
    description: `Get details about a specific Discord channel by its channel ID.`,
    parameters: z.object({
      channelId: z.string().describe("The Discord channel ID to get details for"),
    }),
    execute: async (params) => {
      const channel = await db
        .select({
          id: schema.discordChannel.id,
          channelId: schema.discordChannel.channelId,
          name: schema.discordChannel.name,
          type: schema.discordChannel.type,
          topic: schema.discordChannel.topic,
          nsfw: schema.discordChannel.nsfw,
          isArchived: schema.discordChannel.isArchived,
          parentId: schema.discordChannel.parentId,
          position: schema.discordChannel.position,
        })
        .from(schema.discordChannel)
        .where(eq(schema.discordChannel.channelId, params.channelId))
        .limit(1);
      return channel[0] || null;
    },
  });
}
