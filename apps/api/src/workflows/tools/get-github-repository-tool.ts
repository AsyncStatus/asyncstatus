import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function getGithubRepositoryTool(db: Db) {
  return tool({
    description: `Get details about a specific GitHub repository by its ID.`,
    parameters: z.object({
      repositoryId: z.string().describe("The repository ID to get details for"),
    }),
    execute: async (params) => {
      const repository = await db
        .select({
          id: schema.githubRepository.id,
          repoId: schema.githubRepository.repoId,
          name: schema.githubRepository.name,
          owner: schema.githubRepository.owner,
          fullName: schema.githubRepository.fullName,
          description: schema.githubRepository.description,
          isPrivate: schema.githubRepository.private,
          htmlUrl: schema.githubRepository.htmlUrl,
        })
        .from(schema.githubRepository)
        .where(eq(schema.githubRepository.id, params.repositoryId))
        .limit(1);
      return repository[0] || null;
    },
  });
}
