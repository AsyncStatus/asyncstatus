import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

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
  for await (const repo of octokit.paginate.iterator("GET /installation/repositories", {
    per_page: 100,
  })) {
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

    if (isTuple(batchUpserts)) {
      await db.batch(batchUpserts);
    }
  }
}
