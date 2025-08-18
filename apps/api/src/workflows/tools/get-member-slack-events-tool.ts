import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getMemberSlackEventsTool(db: Db) {
  return tool({
    description: `Get the Slack events for the member between the effectiveFrom and effectiveTo dates. Optionally filter by channelIds (if empty, include all).`,
    parameters: z.object({
      organizationId: z.string(),
      memberId: z.string(),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
      channelIds: z.array(z.string()).optional().default([]),
    }),
    execute: async (params) => {
      const conditions = [
        eq(schema.slackIntegration.organizationId, params.organizationId),
        eq(schema.member.id, params.memberId),
        gte(schema.slackEvent.createdAt, new Date(params.effectiveFrom)),
        lte(schema.slackEvent.createdAt, new Date(params.effectiveTo)),
      ];

      if (params.channelIds && params.channelIds.length > 0) {
        conditions.push(inArray(schema.slackEvent.channelId, params.channelIds));
      }

      const events = await db
        .selectDistinct({
          slackEvent: {
            id: schema.slackEvent.id,
            slackEventId: schema.slackEvent.slackEventId,
            createdAt: schema.slackEvent.createdAt,
          },
          slackEventVector: { embeddingText: schema.slackEventVector.embeddingText },
          slackUser: { id: schema.slackUser.id, slackUserId: schema.slackUser.slackUserId },
          member: { id: schema.member.id, slackId: schema.member.slackId },
        })
        .from(schema.slackEvent)
        .innerJoin(
          schema.slackIntegration,
          eq(schema.slackEvent.slackTeamId, schema.slackIntegration.teamId),
        )
        .leftJoin(
          schema.slackEventVector,
          eq(schema.slackEvent.id, schema.slackEventVector.eventId),
        )
        .innerJoin(
          schema.slackUser,
          eq(schema.slackEvent.slackUserId, schema.slackUser.slackUserId),
        )
        .innerJoin(schema.member, eq(schema.member.slackId, schema.slackUser.slackUserId))
        .where(and(...conditions))
        .orderBy(desc(schema.slackEvent.createdAt));
      return events;
    },
  });
}
