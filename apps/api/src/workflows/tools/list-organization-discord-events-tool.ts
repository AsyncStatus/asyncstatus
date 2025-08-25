import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";

export function listOrganizationDiscordEventsTool(db: Db) {
  return tool({
    description:
      "List Discord events for an organization within a date range. Optionally filter by multiple channel IDs; if channelIds is empty, return all events.",
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
        eq(schema.discordIntegration.organizationId, params.organizationId),
        gte(schema.discordEvent.createdAt, effectiveFromDate),
        lte(schema.discordEvent.createdAt, effectiveToDate),
      ];

      if (params.channelIds && params.channelIds.length > 0) {
        conditions.push(inArray(schema.discordEvent.channelId, params.channelIds));
      }

      const rows = await db
        .selectDistinct({
          discordEvent: {
            id: schema.discordEvent.id,
            discordEventId: schema.discordEvent.discordEventId,
            type: schema.discordEvent.type,
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
        .innerJoin(schema.discordServer, eq(schema.discordEvent.serverId, schema.discordServer.id))
        .innerJoin(
          schema.discordIntegration,
          eq(schema.discordServer.integrationId, schema.discordIntegration.id),
        )
        .leftJoin(
          schema.discordEventVector,
          eq(schema.discordEvent.id, schema.discordEventVector.eventId),
        )
        .leftJoin(
          schema.discordChannel,
          eq(schema.discordEvent.channelId, schema.discordChannel.channelId),
        )
        .leftJoin(
          schema.discordUser,
          eq(schema.discordEvent.discordUserId, schema.discordUser.discordUserId),
        )
        .where(and(...conditions))
        .orderBy(desc(schema.discordEvent.createdAt));

      return rows;
    },
  });
}
