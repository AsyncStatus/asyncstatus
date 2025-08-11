import { dayjs } from "@asyncstatus/dayjs";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationSlackEventsTool(db: Db) {
  return tool({
    description:
      "List Slack events for an organization within a date range. Optionally filter by multiple channel IDs; if channelIds is empty, return all events.",
    parameters: z.object({
      organizationId: z.string(),
      channelIds: z.array(z.string()).optional().default([]),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
    }),
    execute: async (params) => {
      const effectiveFromDate = dayjs(params.effectiveFrom).toDate();
      const effectiveToDate = dayjs(params.effectiveTo).toDate();

      const conditions = [
        eq(schema.slackIntegration.organizationId, params.organizationId),
        gte(schema.slackEvent.createdAt, effectiveFromDate),
        lte(schema.slackEvent.createdAt, effectiveToDate),
      ];

      if (params.channelIds && params.channelIds.length > 0) {
        conditions.push(inArray(schema.slackChannel.channelId, params.channelIds));
      }

      const rows = await db
        .selectDistinct({
          slackEvent: {
            id: schema.slackEvent.id,
            slackEventId: schema.slackEvent.slackEventId,
            type: schema.slackEvent.type,
            createdAt: schema.slackEvent.createdAt,
          },
          slackEventVector: { embeddingText: schema.slackEventVector.embeddingText },
          slackChannel: {
            id: schema.slackChannel.id,
            channelId: schema.slackChannel.channelId,
            name: schema.slackChannel.name,
            isPrivate: schema.slackChannel.isPrivate,
          },
          slackUser: {
            id: schema.slackUser.id,
            slackUserId: schema.slackUser.slackUserId,
            username: schema.slackUser.username,
            displayName: schema.slackUser.displayName,
          },
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
        .leftJoin(
          schema.slackChannel,
          eq(schema.slackEvent.channelId, schema.slackChannel.channelId),
        )
        .leftJoin(schema.slackUser, eq(schema.slackEvent.slackUserId, schema.slackUser.slackUserId))
        .where(and(...conditions))
        .orderBy(desc(schema.slackEvent.createdAt));

      return rows;
    },
  });
}
