import { tool } from "ai";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import * as schema from "../../db";
import type { Db } from "../../db/db";

export function getMemberGithubEventsTool(db: Db) {
  return tool({
    description: `Get the GitHub events for the member between the effectiveFrom and effectiveTo dates. Optionally filter by repositoryIds (if empty, include all).`,
    parameters: z.object({
      organizationId: z.string(),
      memberId: z.string(),
      effectiveFrom: z
        .string()
        .describe("The effectiveFrom date in ISO 8601 format, e.g. 2025-01-01T00:00:00Z."),
      effectiveTo: z
        .string()
        .describe("The effectiveTo date in ISO 8601 format, e.g. 2025-01-02T00:00:00Z."),
      repositoryIds: z.array(z.string()).optional().default([]),
    }),
    execute: async (params) => {
      const conditions = [
        eq(schema.githubIntegration.organizationId, params.organizationId),
        eq(schema.member.id, params.memberId),
        gte(schema.githubEvent.createdAt, new Date(params.effectiveFrom)),
        lte(schema.githubEvent.createdAt, new Date(params.effectiveTo)),
      ];

      if (params.repositoryIds && params.repositoryIds.length > 0) {
        conditions.push(inArray(schema.githubRepository.id, params.repositoryIds));
      }

      const events = await db
        .selectDistinct({
          githubEvent: {
            id: schema.githubEvent.id,
            githubId: schema.githubEvent.githubId,
            createdAt: schema.githubEvent.createdAt,
          },
          githubEventVector: { embeddingText: schema.githubEventVector.embeddingText },
          githubUser: { id: schema.githubUser.id, login: schema.githubUser.login },
          member: { id: schema.member.id, githubId: schema.member.githubId },
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
        .innerJoin(schema.member, eq(schema.member.githubId, schema.githubUser.githubId))
        .where(and(...conditions))
        .orderBy(desc(schema.githubEvent.createdAt));
      return events;
    },
  });
}
