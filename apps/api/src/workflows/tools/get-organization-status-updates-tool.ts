import { tool } from "ai";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getOrganizationStatusUpdatesTool(db: Db) {
  return tool({
    description: `Get all status updates for an organization between the effectiveFrom and effectiveTo dates to summarize team activity.`,
    parameters: z.object({
      organizationId: z.string(),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
    }),
    execute: async (params) => {
      const effectiveFromDate = new Date(params.effectiveFrom);
      const effectiveToDate = new Date(params.effectiveTo);

      const statusUpdates = await db
        .select({
          statusUpdate: {
            id: schema.statusUpdate.id,
            effectiveFrom: schema.statusUpdate.effectiveFrom,
            effectiveTo: schema.statusUpdate.effectiveTo,
            isDraft: schema.statusUpdate.isDraft,
            mood: schema.statusUpdate.mood,
            emoji: schema.statusUpdate.emoji,
            notes: schema.statusUpdate.notes,
            timezone: schema.statusUpdate.timezone,
            createdAt: schema.statusUpdate.createdAt,
          },
          statusUpdateItem: {
            id: schema.statusUpdateItem.id,
            content: schema.statusUpdateItem.content,
            isBlocker: schema.statusUpdateItem.isBlocker,
            isInProgress: schema.statusUpdateItem.isInProgress,
            order: schema.statusUpdateItem.order,
            createdAt: schema.statusUpdateItem.createdAt,
          },
          member: {
            id: schema.member.id,
            role: schema.member.role,
          },
          user: {
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
            timezone: schema.user.timezone,
          },
        })
        .from(schema.statusUpdate)
        .innerJoin(
          schema.statusUpdateItem,
          eq(schema.statusUpdate.id, schema.statusUpdateItem.statusUpdateId),
        )
        .innerJoin(schema.member, eq(schema.statusUpdate.memberId, schema.member.id))
        .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
        .where(
          and(
            eq(schema.statusUpdate.organizationId, params.organizationId),
            eq(schema.statusUpdate.isDraft, false), // Only published status updates
            gte(schema.statusUpdate.effectiveFrom, effectiveFromDate),
            lte(schema.statusUpdate.effectiveTo, effectiveToDate),
          ),
        )
        .orderBy(desc(schema.statusUpdate.effectiveFrom), schema.statusUpdateItem.order);

      return statusUpdates;
    },
  });
}
