import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getSlackUserTool(db: Db) {
  return tool({
    description: `Get details about a specific Slack user by their user ID.`,
    parameters: z.object({
      slackUserId: z.string().describe("The Slack user ID to get details for"),
    }),
    execute: async (params) => {
      const user = await db
        .select({
          id: schema.slackUser.id,
          slackUserId: schema.slackUser.slackUserId,
          username: schema.slackUser.username,
          displayName: schema.slackUser.displayName,
          email: schema.slackUser.email,
          avatarUrl: schema.slackUser.avatarUrl,
          isBot: schema.slackUser.isBot,
          isInstaller: schema.slackUser.isInstaller,
        })
        .from(schema.slackUser)
        .where(eq(schema.slackUser.slackUserId, params.slackUserId))
        .limit(1);
      return user[0] || null;
    },
  });
}
