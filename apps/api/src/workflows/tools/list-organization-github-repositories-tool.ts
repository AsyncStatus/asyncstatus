import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function listOrganizationGithubRepositoriesTool(db: Db) {
  return tool({
    description: `List GitHub repositories for an organization's GitHub integration. Use to map names to repository IDs.`,
    parameters: z.object({
      organizationId: z.string().describe("The organization ID that owns the GitHub integration"),
    }),
    execute: async (params) => {
      const repositories = await db
        .select({
          id: schema.githubRepository.id,
          repoId: schema.githubRepository.repoId,
          name: schema.githubRepository.name,
          owner: schema.githubRepository.owner,
          fullName: schema.githubRepository.fullName,
          private: schema.githubRepository.private,
          htmlUrl: schema.githubRepository.htmlUrl,
          createdAt: schema.githubRepository.createdAt,
        })
        .from(schema.githubRepository)
        .innerJoin(
          schema.githubIntegration,
          eq(schema.githubRepository.integrationId, schema.githubIntegration.id),
        )
        .where(eq(schema.githubIntegration.organizationId, params.organizationId));

      return repositories;
    },
  });
}
