import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";

import type { Db } from "../../../db";
import * as schema from "../../../db/schema";

type FetchAndSyncRepositoriesParams = {
  octokit: Octokit;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncRepositories({
  octokit,
  db,
  integrationId,
}: FetchAndSyncRepositoriesParams) {
  for await (const repo of octokit.paginate.iterator(
    "GET /installation/repositories",
    { per_page: 100 },
  )) {
    const batchUpserts = repo.data.map((repo) => {
      return db
        .insert(schema.githubRepository)
        .values({
          id: nanoid(),
          integrationId,
          repoId: repo.id.toString(),
          owner: repo.owner.login,
          description: repo.description,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          htmlUrl: repo.html_url,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.githubRepository.repoId,
          setWhere: eq(schema.githubRepository.integrationId, integrationId),
          set: {
            description: repo.description,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            htmlUrl: repo.html_url,
            updatedAt: new Date(),
          },
        });
    });

    await db.batch(batchUpserts as any);
  }
}
