import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type FetchAndSyncContributorsParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
  repo: string;
};

export async function fetchAndSyncContributors({
  octokit,
  db,
  owner,
  repo,
}: FetchAndSyncContributorsParams) {
  for await (const contributors of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/contributors",
    { owner, repo, per_page: 10 },
  )) {
    const now = new Date();

    const contributorUpserts = contributors.data
      .map((user) => {
        const login = user.login?.toLowerCase().trim();
        if (!login) return;

        const insertBuilder = db.insert(schema.changelogGithubContributor).values({
          id: nanoid(),
          login,
          githubUserId: user.id ? String(user.id) : undefined,
          avatarUrl: user.avatar_url,
          htmlUrl: user.html_url,
          createdAt: now,
          updatedAt: now,
        });

        if (user.id) {
          return insertBuilder.onConflictDoUpdate({
            target: schema.changelogGithubContributor.githubUserId,
            set: {
              login,
              avatarUrl: user.avatar_url,
              htmlUrl: user.html_url,
              updatedAt: now,
            },
          });
        }

        return insertBuilder.onConflictDoUpdate({
          target: schema.changelogGithubContributor.login,
          set: {
            avatarUrl: user.avatar_url,
            htmlUrl: user.html_url,
            updatedAt: now,
          },
        });
      })
      .filter((x) => x !== undefined);

    if (isTuple(contributorUpserts)) {
      await db.batch(contributorUpserts);
    }

    const repoContributorUpserts = contributors.data
      .map((user) => {
        const login = user.login?.toLowerCase().trim();
        if (!login) return;

        const contributions = user.contributions ?? 0;

        return db
          .insert(schema.changelogGithubRepoContributor)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName: repo,
            contributorLogin: login,
            commitCount: contributions,
            createdAt: now,
            updatedAt: now,
            firstSeenAt: now,
            lastSeenAt: now,
          })
          .onConflictDoUpdate({
            target: [
              schema.changelogGithubRepoContributor.repoOwner,
              schema.changelogGithubRepoContributor.repoName,
              schema.changelogGithubRepoContributor.contributorLogin,
            ],
            set: {
              commitCount: contributions,
              updatedAt: now,
              lastSeenAt: now,
            },
          });
      })
      .filter((x) => x !== undefined);

    if (isTuple(repoContributorUpserts)) {
      await db.batch(repoContributorUpserts);
    }
  }
}
