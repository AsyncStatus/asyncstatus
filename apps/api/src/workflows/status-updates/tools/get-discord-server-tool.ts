import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

export function getDiscordServerTool(db: Db) {
  return tool({
    description: `Get details about a specific Discord server by its guild ID.`,
    parameters: z.object({
      guildId: z.string().describe("The Discord guild/server ID to get details for"),
    }),
    execute: async (params) => {
      const server = await db
        .select({
          id: schema.discordServer.id,
          guildId: schema.discordServer.guildId,
          name: schema.discordServer.name,
          description: schema.discordServer.description,
          iconUrl: schema.discordServer.iconUrl,
          memberCount: schema.discordServer.memberCount,
          verificationLevel: schema.discordServer.verificationLevel,
          defaultMessageNotifications: schema.discordServer.defaultMessageNotifications,
          explicitContentFilter: schema.discordServer.explicitContentFilter,
          features: schema.discordServer.features,
          premiumTier: schema.discordServer.premiumTier,
        })
        .from(schema.discordServer)
        .where(eq(schema.discordServer.guildId, params.guildId))
        .limit(1);
      return server[0] || null;
    },
  });
}
