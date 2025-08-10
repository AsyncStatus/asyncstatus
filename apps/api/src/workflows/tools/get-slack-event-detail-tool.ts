import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

export function getSlackEventDetailTool(db: Db) {
  return tool({
    description: `Get detailed information about a specific Slack event by its ID, including payload data, channel information, message content, etc.`,
    parameters: z.object({
      eventId: z.string().describe("The Slack event ID to get details for"),
    }),
    execute: async (params) => {
      const eventDetail = await db
        .select({
          slackEvent: {
            id: schema.slackEvent.id,
            slackEventId: schema.slackEvent.slackEventId,
            type: schema.slackEvent.type,
            payload: schema.slackEvent.payload,
            messageTs: schema.slackEvent.messageTs,
            threadTs: schema.slackEvent.threadTs,
            createdAt: schema.slackEvent.createdAt,
          },
          slackEventVector: { embeddingText: schema.slackEventVector.embeddingText },
          slackChannel: {
            name: schema.slackChannel.name,
            channelId: schema.slackChannel.channelId,
            isPrivate: schema.slackChannel.isPrivate,
          },
          slackUser: {
            username: schema.slackUser.username,
            displayName: schema.slackUser.displayName,
          },
        })
        .from(schema.slackEvent)
        .leftJoin(
          schema.slackEventVector,
          eq(schema.slackEvent.id, schema.slackEventVector.eventId),
        )
        .leftJoin(
          schema.slackChannel,
          eq(schema.slackEvent.channelId, schema.slackChannel.channelId),
        )
        .leftJoin(schema.slackUser, eq(schema.slackEvent.slackUserId, schema.slackUser.slackUserId))
        .where(eq(schema.slackEvent.id, params.eventId))
        .limit(1);
      return eventDetail[0] || null;
    },
  });
}
