import { dayjs } from "@asyncstatus/dayjs";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationGitlabEventsTool(db: Db) {
  return tool({
    description:
      "List GitLab events for an organization within a date range. Optionally filter by multiple project IDs; if projectIds is empty, return all events.",
    parameters: z.object({
      organizationId: z.string(),
      projectIds: z.array(z.string()).optional().describe("IDs of gitlab_project (internal IDs)"),
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
        eq(schema.gitlabIntegration.organizationId, params.organizationId),
        gte(schema.gitlabEvent.createdAt, effectiveFromDate),
        lte(schema.gitlabEvent.createdAt, effectiveToDate),
      ];

      if (params.projectIds && params.projectIds.length > 0) {
        conditions.push(inArray(schema.gitlabProject.id, params.projectIds));
      }

      const rows = await db
        .selectDistinct({
          gitlabEvent: {
            id: schema.gitlabEvent.id,
            gitlabId: schema.gitlabEvent.gitlabId,
            type: schema.gitlabEvent.type,
            action: schema.gitlabEvent.action,
            createdAt: schema.gitlabEvent.createdAt,
          },
          gitlabEventVector: { embeddingText: schema.gitlabEventVector.embeddingText },
          gitlabProject: {
            id: schema.gitlabProject.id,
            projectId: schema.gitlabProject.projectId,
            name: schema.gitlabProject.name,
            pathWithNamespace: schema.gitlabProject.pathWithNamespace,
          },
          gitlabUser: {
            id: schema.gitlabUser.id,
            gitlabId: schema.gitlabUser.gitlabId,
            username: schema.gitlabUser.username,
            name: schema.gitlabUser.name,
          },
        })
        .from(schema.gitlabEvent)
        .innerJoin(schema.gitlabProject, eq(schema.gitlabEvent.projectId, schema.gitlabProject.id))
        .innerJoin(
          schema.gitlabIntegration,
          eq(schema.gitlabProject.integrationId, schema.gitlabIntegration.id),
        )
        .leftJoin(
          schema.gitlabEventVector,
          eq(schema.gitlabEvent.id, schema.gitlabEventVector.eventId),
        )
        .leftJoin(
          schema.gitlabUser,
          and(
            eq(schema.gitlabUser.gitlabId, schema.gitlabEvent.gitlabActorId),
            eq(schema.gitlabUser.integrationId, schema.gitlabIntegration.id),
          ),
        )
        .where(and(...conditions))
        .orderBy(desc(schema.gitlabEvent.createdAt));

      return rows;
    },
  });
}
