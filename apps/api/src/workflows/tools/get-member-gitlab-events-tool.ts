import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";

export function getMemberGitlabEventsTool(db: Db) {
  return tool({
    description:
      "Get the GitLab events for the member between the effectiveFrom and effectiveTo dates. Optionally filter by projectIds (if empty, include all).",
    parameters: z.object({
      organizationId: z.string(),
      memberId: z.string(),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
      projectIds: z.array(z.string()).optional().default([]),
    }),
    execute: async (params) => {
      const conditions = [
        eq(schema.gitlabIntegration.organizationId, params.organizationId),
        eq(schema.member.id, params.memberId),
        gte(schema.gitlabEvent.createdAt, new Date(params.effectiveFrom)),
        lte(schema.gitlabEvent.createdAt, new Date(params.effectiveTo)),
      ];

      if (params.projectIds && params.projectIds.length > 0) {
        conditions.push(inArray(schema.gitlabProject.id, params.projectIds));
      }

      const events = await db
        .selectDistinct({
          gitlabEvent: {
            id: schema.gitlabEvent.id,
            gitlabId: schema.gitlabEvent.gitlabId,
            type: schema.gitlabEvent.type,
            action: schema.gitlabEvent.action,
            createdAt: schema.gitlabEvent.createdAt,
          },
          gitlabEventVector: { embeddingText: schema.gitlabEventVector.embeddingText },
          gitlabUser: { id: schema.gitlabUser.id, username: schema.gitlabUser.username },
          member: { id: schema.member.id, gitlabId: schema.member.gitlabId },
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
        .innerJoin(
          schema.gitlabUser,
          and(
            eq(schema.gitlabUser.gitlabId, schema.gitlabEvent.gitlabActorId),
            eq(schema.gitlabUser.integrationId, schema.gitlabIntegration.id),
          ),
        )
        .innerJoin(schema.member, eq(schema.member.gitlabId, schema.gitlabUser.gitlabId))
        .where(and(...conditions))
        .orderBy(desc(schema.gitlabEvent.createdAt));

      return events;
    },
  });
}
