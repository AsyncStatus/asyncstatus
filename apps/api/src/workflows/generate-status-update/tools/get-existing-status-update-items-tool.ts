import { tool } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";

export function getExistingStatusUpdateItemsTool(db: Db) {
  return tool({
    description: `Get existing status update items for the member between the effectiveFrom and effectiveTo dates to enrich or build upon them.`,
    parameters: z.object({
      organizationId: z.string(),
      memberId: z.string(),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
    }),
    execute: async (params) => {
      const existingItems = await db
        .select({
          statusUpdate: {
            id: schema.statusUpdate.id,
            effectiveFrom: schema.statusUpdate.effectiveFrom,
            effectiveTo: schema.statusUpdate.effectiveTo,
            isDraft: schema.statusUpdate.isDraft,
            mood: schema.statusUpdate.mood,
            emoji: schema.statusUpdate.emoji,
            notes: schema.statusUpdate.notes,
          },
          statusUpdateItem: {
            id: schema.statusUpdateItem.id,
            content: schema.statusUpdateItem.content,
            isBlocker: schema.statusUpdateItem.isBlocker,
            isInProgress: schema.statusUpdateItem.isInProgress,
            order: schema.statusUpdateItem.order,
            createdAt: schema.statusUpdateItem.createdAt,
          },
        })
        .from(schema.statusUpdate)
        .innerJoin(
          schema.statusUpdateItem,
          eq(schema.statusUpdate.id, schema.statusUpdateItem.statusUpdateId),
        )
        .where(
          and(
            eq(schema.statusUpdate.organizationId, params.organizationId),
            eq(schema.statusUpdate.memberId, params.memberId),
            eq(schema.statusUpdate.effectiveFrom, new Date(params.effectiveFrom)),
            eq(schema.statusUpdate.effectiveTo, new Date(params.effectiveTo)),
          ),
        )
        .orderBy(desc(schema.statusUpdateItem.order));
      return existingItems;
    },
  });
}
