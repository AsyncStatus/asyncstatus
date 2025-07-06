import { asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import * as schema from "../../../db";
import type { Db } from "../../../db/db";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncUsersParams = {
  octokit: Octokit;
  db: Db;
  integrationId: string;
};

export async function fetchAndSyncUsers({ octokit, db, integrationId }: FetchAndSyncUsersParams) {
  const orgs = await db
    .selectDistinct({ owner: schema.githubRepository.owner })
    .from(schema.githubRepository)
    .where(eq(schema.githubRepository.integrationId, integrationId))
    .orderBy(asc(schema.githubRepository.createdAt));

  for (const { owner: org } of orgs) {
    for await (const member of octokit.paginate.iterator("GET /orgs/{org}/members", {
      org,
      per_page: 100,
    })) {
      const batchUpserts = member.data.map((user) => {
        return db
          .insert(schema.githubUser)
          .values({
            id: nanoid(),
            integrationId,
            githubId: user.id.toString(),
            login: user.login,
            avatarUrl: user.avatar_url,
            createdAt: new Date(),
            updatedAt: new Date(),
            htmlUrl: user.url,
            email: user.email,
          })
          .onConflictDoUpdate({
            target: schema.githubUser.githubId,
            setWhere: eq(schema.githubUser.integrationId, integrationId),
            set: {
              login: user.login,
              avatarUrl: user.avatar_url,
              updatedAt: new Date(),
              htmlUrl: user.url,
              email: user.email,
              name: user.name,
            },
          });
      });

      if (isTuple(batchUpserts)) {
        await db.batch(batchUpserts);
      }
    }
  }
}
