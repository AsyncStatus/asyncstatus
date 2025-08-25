import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getGithubEventDetailTool(db: Db) {
  return tool({
    description: `Get detailed information about a specific GitHub event by its ID, including payload data, commit messages, PR numbers, etc.`,
    parameters: z.object({
      eventId: z.string().describe("The GitHub event ID to get details for"),
    }),
    execute: async (params) => {
      const eventDetail = await db
        .select({
          githubEvent: {
            id: schema.githubEvent.id,
            githubId: schema.githubEvent.githubId,
            type: schema.githubEvent.type,
            payload: schema.githubEvent.payload,
            createdAt: schema.githubEvent.createdAt,
          },
          githubEventVector: { embeddingText: schema.githubEventVector.embeddingText },
          githubRepository: {
            name: schema.githubRepository.name,
            fullName: schema.githubRepository.fullName,
          },
          githubUser: {
            login: schema.githubUser.login,
            name: schema.githubUser.name,
          },
        })
        .from(schema.githubEvent)
        .leftJoin(
          schema.githubEventVector,
          eq(schema.githubEvent.id, schema.githubEventVector.eventId),
        )
        .leftJoin(
          schema.githubRepository,
          eq(schema.githubEvent.repositoryId, schema.githubRepository.id),
        )
        .leftJoin(
          schema.githubUser,
          eq(schema.githubEvent.githubActorId, schema.githubUser.githubId),
        )
        .where(eq(schema.githubEvent.id, params.eventId))
        .limit(1);
      return eventDetail[0] || null;
    },
  });
}
