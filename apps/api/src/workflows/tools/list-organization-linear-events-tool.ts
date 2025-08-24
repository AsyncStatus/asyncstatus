import { dayjs } from "@asyncstatus/dayjs";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationLinearEventsTool(db: Db) {
  return tool({
    description:
      "List Linear events for an organization within a date range. Optionally filter by multiple team IDs and/or project IDs; if none provided, return all events.",
    parameters: z.object({
      organizationId: z.string().describe("The organization ID"),
      teamIds: z.array(z.string()).default([]).describe("Linear team IDs to filter by"),
      projectIds: z.array(z.string()).default([]).describe("Linear project IDs to filter by"),
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
        eq(schema.linearIntegration.organizationId, params.organizationId),
        gte(schema.linearEvent.createdAt, effectiveFromDate),
        lte(schema.linearEvent.createdAt, effectiveToDate),
      ];

      if (params.teamIds && params.teamIds.length > 0) {
        conditions.push(inArray(schema.linearEvent.teamId, params.teamIds));
      }

      if (params.projectIds && params.projectIds.length > 0) {
        conditions.push(inArray(schema.linearEvent.projectId, params.projectIds));
      }

      const rows = await db
        .selectDistinct({
          linearEvent: {
            id: schema.linearEvent.id,
            externalId: schema.linearEvent.externalId,
            type: schema.linearEvent.type,
            action: schema.linearEvent.action,
            createdAt: schema.linearEvent.createdAt,
            teamId: schema.linearEvent.teamId,
            projectId: schema.linearEvent.projectId,
          },
          linearEventVector: { embeddingText: schema.linearEventVector.embeddingText },
          linearTeam: {
            id: schema.linearTeam.id,
            teamId: schema.linearTeam.teamId,
            name: schema.linearTeam.name,
            key: schema.linearTeam.key,
          },
          linearProject: {
            id: schema.linearProject.id,
            projectId: schema.linearProject.projectId,
            name: schema.linearProject.name,
            key: schema.linearProject.key,
          },
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
        .leftJoin(schema.linearTeam, eq(schema.linearEvent.teamId, schema.linearTeam.teamId))
        .leftJoin(
          schema.linearProject,
          eq(schema.linearEvent.projectId, schema.linearProject.projectId),
        )
        .where(and(...conditions))
        .orderBy(desc(schema.linearEvent.createdAt));

      return rows;
    },
  });
}
