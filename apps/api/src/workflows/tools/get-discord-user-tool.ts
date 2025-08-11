import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getDiscordUserTool(db: Db) {
  return tool({
    description: `Get details about a specific Discord user by their user ID.`,
    parameters: z.object({
      discordUserId: z.string().describe("The Discord user ID to get details for"),
    }),
    execute: async (params) => {
      const user = await db
        .select({
          id: schema.discordUser.id,
          discordUserId: schema.discordUser.discordUserId,
          username: schema.discordUser.username,
          globalName: schema.discordUser.globalName,
          discriminator: schema.discordUser.discriminator,
          email: schema.discordUser.email,
          avatarHash: schema.discordUser.avatarHash,
          isBot: schema.discordUser.isBot,
          isSystem: schema.discordUser.isSystem,
          verified: schema.discordUser.verified,
        })
        .from(schema.discordUser)
        .where(eq(schema.discordUser.discordUserId, params.discordUserId))
        .limit(1);
      return user[0] || null;
    },
  });
}
