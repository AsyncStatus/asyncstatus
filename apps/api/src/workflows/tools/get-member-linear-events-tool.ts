import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getMemberLinearEventsTool(db: Db) {
  return tool({
    description: `Get the Linear events for the member between the effectiveFrom and effectiveTo dates. Optionally filter by teamIds/projectIds (if empty, include all).`,
    parameters: z.object({
      organizationId: z.string(),
      memberId: z.string(),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
      teamIds: z.array(z.string()).optional().default([]),
      projectIds: z.array(z.string()).optional().default([]),
    }),
    execute: async (params) => {
      const conditions = [
        eq(schema.linearIntegration.organizationId, params.organizationId),
        eq(schema.member.id, params.memberId),
        gte(schema.linearEvent.createdAt, new Date(params.effectiveFrom)),
        lte(schema.linearEvent.createdAt, new Date(params.effectiveTo)),
      ];

      if (params.teamIds && params.teamIds.length > 0) {
        conditions.push(inArray(schema.linearEvent.teamId, params.teamIds));
      }
      if (params.projectIds && params.projectIds.length > 0) {
        conditions.push(inArray(schema.linearEvent.projectId, params.projectIds));
      }

      const events = await db
        .selectDistinct({
          linearEvent: {
            id: schema.linearEvent.id,
            externalId: schema.linearEvent.externalId,
            createdAt: schema.linearEvent.createdAt,
          },
          linearEventVector: { embeddingText: schema.linearEventVector.embeddingText },
          member: { id: schema.member.id },
        })
        .from(schema.linearEvent)
        .innerJoin(
          schema.linearIntegration,
          eq(schema.linearEvent.integrationId, schema.linearIntegration.id),
        )
        .leftJoin(
          schema.linearEventVector,
          eq(schema.linearEvent.id, schema.linearEventVector.eventId),
        )
        .leftJoin(schema.linearUser, eq(schema.linearEvent.userId, schema.linearUser.userId))
        .innerJoin(schema.member, eq(schema.member.linearId, schema.linearUser.id))
        .where(and(...conditions))
        .orderBy(desc(schema.linearEvent.createdAt));

      return events;
    },
  });
}
