import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getSlackChannelTool(db: Db) {
  return tool({
    description: `Get details about a specific Slack channel by its channel ID.`,
    parameters: z.object({
      channelId: z.string().describe("The Slack channel ID to get details for"),
    }),
    execute: async (params) => {
      const channel = await db
        .select({
          id: schema.slackChannel.id,
          channelId: schema.slackChannel.channelId,
          name: schema.slackChannel.name,
          isPrivate: schema.slackChannel.isPrivate,
          topic: schema.slackChannel.topic,
          purpose: schema.slackChannel.purpose,
          isArchived: schema.slackChannel.isArchived,
          isGeneral: schema.slackChannel.isGeneral,
          isIm: schema.slackChannel.isIm,
          isMpim: schema.slackChannel.isMpim,
          isGroup: schema.slackChannel.isGroup,
          isShared: schema.slackChannel.isShared,
        })
        .from(schema.slackChannel)
        .where(eq(schema.slackChannel.channelId, params.channelId))
        .limit(1);
      return channel[0] || null;
    },
  });
}
