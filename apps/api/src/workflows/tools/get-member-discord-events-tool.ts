import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";

export function getMemberDiscordEventsTool(db: Db) {
  return tool({
    description: `Get the Discord events for the member between the effectiveFrom and effectiveTo dates. Optionally filter by channelIds (if empty, include all).`,
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
        eq(schema.discordIntegration.organizationId, params.organizationId),
        eq(schema.member.id, params.memberId),
        gte(schema.discordEvent.createdAt, new Date(params.effectiveFrom)),
        lte(schema.discordEvent.createdAt, new Date(params.effectiveTo)),
      ];

      if (params.channelIds && params.channelIds.length > 0) {
        conditions.push(inArray(schema.discordEvent.channelId, params.channelIds));
      }

      const events = await db
        .selectDistinct({
          discordEvent: {
            id: schema.discordEvent.id,
            discordEventId: schema.discordEvent.discordEventId,
            type: schema.discordEvent.type,
            createdAt: schema.discordEvent.createdAt,
          },
          discordEventVector: { embeddingText: schema.discordEventVector.embeddingText },
          discordUser: {
            id: schema.discordUser.id,
            username: schema.discordUser.username,
            globalName: schema.discordUser.globalName,
          },
          member: { id: schema.member.id, discordId: schema.member.discordId },
        })
        .from(schema.discordEvent)
        .innerJoin(schema.discordServer, eq(schema.discordEvent.serverId, schema.discordServer.id))
        .innerJoin(
          schema.discordIntegration,
          eq(schema.discordServer.integrationId, schema.discordIntegration.id),
        )
        .leftJoin(
          schema.discordEventVector,
          eq(schema.discordEvent.id, schema.discordEventVector.eventId),
        )
        .innerJoin(schema.member, eq(schema.member.discordId, schema.discordEvent.discordUserId))
        .leftJoin(
          schema.discordUser,
          and(
            eq(schema.discordUser.discordUserId, schema.discordEvent.discordUserId),
            eq(schema.discordUser.integrationId, schema.discordIntegration.id),
          ),
        )
        .where(and(...conditions))
        .orderBy(desc(schema.discordEvent.createdAt));
      return events;
    },
  });
}
