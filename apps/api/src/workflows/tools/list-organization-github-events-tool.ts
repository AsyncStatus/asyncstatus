import { dayjs } from "@asyncstatus/dayjs";
import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function listOrganizationGithubEventsTool(db: Db) {
  return tool({
    description:
      "List GitHub events for an organization within a date range. Optionally filter by multiple repository IDs; if repositoryIds is empty, return all events.",
    parameters: z.object({
      organizationId: z.string(),
      repositoryIds: z.array(z.string()).optional().default([]),
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
        eq(schema.githubIntegration.organizationId, params.organizationId),
        gte(schema.githubEvent.createdAt, effectiveFromDate),
        lte(schema.githubEvent.createdAt, effectiveToDate),
      ];

      if (params.repositoryIds && params.repositoryIds.length > 0) {
        conditions.push(inArray(schema.githubRepository.id, params.repositoryIds));
      }

      const rows = await db
        .selectDistinct({
          githubEvent: {
            id: schema.githubEvent.id,
            githubId: schema.githubEvent.githubId,
            type: schema.githubEvent.type,
            createdAt: schema.githubEvent.createdAt,
          },
          githubEventVector: { embeddingText: schema.githubEventVector.embeddingText },
          githubRepository: {
            id: schema.githubRepository.id,
            name: schema.githubRepository.name,
            fullName: schema.githubRepository.fullName,
          },
          githubUser: {
            id: schema.githubUser.id,
            login: schema.githubUser.login,
            name: schema.githubUser.name,
          },
        })
        .from(schema.githubEvent)
        .innerJoin(
          schema.githubRepository,
          eq(schema.githubEvent.repositoryId, schema.githubRepository.id),
        )
        .innerJoin(
          schema.githubIntegration,
          eq(schema.githubRepository.integrationId, schema.githubIntegration.id),
        )
        .innerJoin(
          schema.githubEventVector,
          eq(schema.githubEvent.id, schema.githubEventVector.eventId),
        )
        .innerJoin(
          schema.githubUser,
          and(
            eq(schema.githubUser.githubId, schema.githubEvent.githubActorId),
            eq(schema.githubUser.integrationId, schema.githubIntegration.id),
          ),
        )
        .where(and(...conditions))
        .limit(100)
        .orderBy(desc(schema.githubEvent.createdAt));

      return rows;
    },
  });
}
