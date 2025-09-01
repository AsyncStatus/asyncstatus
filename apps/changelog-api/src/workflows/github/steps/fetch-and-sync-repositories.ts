import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { Endpoints } from "@octokit/types";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type ListUserReposParameters = Endpoints["GET /users/{username}/repos"]["parameters"];
type ListOrgReposParameters = Endpoints["GET /orgs/{org}/repos"]["parameters"];
type RepoItem = Endpoints["GET /orgs/{org}/repos"]["response"]["data"][number];

type FetchAndSyncRepositoriesParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
};

export async function fetchAndSyncRepositories({
  octokit,
  db,
  owner,
}: FetchAndSyncRepositoriesParams) {
  const user = await octokit.rest.users.getByUsername({ username: owner });
  const isOrg = user.data.type === "Organization";

  const baseParams = {
    per_page: 50,
    type: "all",
    sort: "updated",
    direction: "desc",
  } as const;

  const iterator = isOrg
    ? octokit.paginate.iterator("GET /orgs/{org}/repos", {
        ...(baseParams as ListOrgReposParameters),
        org: owner,
      })
    : octokit.paginate.iterator("GET /users/{username}/repos", {
        ...(baseParams as ListUserReposParameters),
        username: owner,
      });

  for await (const page of iterator) {
    const now = new Date();

    const upserts = (page.data as RepoItem[])
      .map((r) => {
        const repoName = r.name;
        if (!repoName) return;

        return db
          .insert(schema.changelogGithubRepository)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName,
            fullName: r.full_name ?? undefined,
            htmlUrl: r.html_url ?? undefined,
            description: r.description ?? undefined,
            defaultBranch: r.default_branch ?? undefined,
            homepage: r.homepage ?? undefined,
            language: r.language ?? undefined,
            license: r.license?.spdx_id ?? undefined,
            isPrivate: !!r.private,
            isFork: !!r.fork,
            isArchived: !!r.archived,
            forksCount: r.forks_count ?? 0,
            stargazersCount: r.stargazers_count ?? 0,
            watchersCount: r.watchers_count ?? 0,
            openIssuesCount: r.open_issues_count ?? 0,
            pushedAt: r.pushed_at ? new Date(r.pushed_at) : undefined,
            firstSeenAt: now,
            lastSeenAt: now,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              schema.changelogGithubRepository.repoOwner,
              schema.changelogGithubRepository.repoName,
            ],
            set: {
              fullName: r.full_name ?? undefined,
              htmlUrl: r.html_url ?? undefined,
              description: r.description ?? undefined,
              defaultBranch: r.default_branch ?? undefined,
              homepage: r.homepage ?? undefined,
              language: r.language ?? undefined,
              license: r.license?.spdx_id ?? undefined,
              isPrivate: !!r.private,
              isFork: !!r.fork,
              isArchived: !!r.archived,
              forksCount: r.forks_count ?? 0,
              stargazersCount: r.stargazers_count ?? 0,
              watchersCount: r.watchers_count ?? 0,
              openIssuesCount: r.open_issues_count ?? 0,
              pushedAt: r.pushed_at ? new Date(r.pushed_at) : undefined,
              lastSeenAt: now,
              updatedAt: now,
            },
          });
      })
      .filter((x) => x !== undefined);

    if (isTuple(upserts)) {
      await db.batch(upserts);
    }
  }
}
