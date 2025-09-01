import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { Endpoints } from "@octokit/types";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type ListPullsParameters = Endpoints["GET /repos/{owner}/{repo}/pulls"]["parameters"];
type ListPullsItem = Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][number];

type FetchAndSyncPullRequestsParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
  repo: string;
  since?: Date;
};

export async function fetchAndSyncPullRequests({
  octokit,
  db,
  owner,
  repo,
  since,
}: FetchAndSyncPullRequestsParams) {
  const baseParams = {
    owner,
    repo,
    per_page: 100,
    state: "all",
    sort: "updated",
    direction: "desc",
  } satisfies ListPullsParameters;

  for await (const page of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/pulls",
    baseParams,
  )) {
    const now = new Date();

    const filtered = page.data.filter((pr: ListPullsItem) => {
      if (!since) return true;
      const mergedAt = pr.merged_at ? new Date(pr.merged_at) : undefined;
      const updatedAt = pr.updated_at ? new Date(pr.updated_at) : undefined;
      const candidate = mergedAt ?? updatedAt ?? new Date(0);
      return candidate >= since;
    });

    const upserts = filtered
      .map((pr: ListPullsItem) => {
        const number = pr.number;
        const externalId = String(number);
        const mergedAt = pr.merged_at ? new Date(pr.merged_at) : undefined;
        const closedAt = pr.closed_at ? new Date(pr.closed_at) : undefined;
        const updatedAt = pr.updated_at ? new Date(pr.updated_at) : undefined;
        const createdAt = pr.created_at ? new Date(pr.created_at) : undefined;
        const eventDate = mergedAt ?? closedAt ?? updatedAt ?? createdAt;
        const htmlUrl = pr.html_url ?? undefined;
        const mergeSha = pr.merge_commit_sha ?? undefined;

        return db
          .insert(schema.changelogGithubEvent)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName: repo,
            sourceType: "pull_request",
            externalId,
            sourceUrl: htmlUrl,
            prNumber: number,
            commitSha: mergeSha,
            payload: pr,
            eventTimestampMs: eventDate,
            insertedAt: now,
            lastSeenAt: now,
          })
          .onConflictDoUpdate({
            target: [
              schema.changelogGithubEvent.repoOwner,
              schema.changelogGithubEvent.repoName,
              schema.changelogGithubEvent.sourceType,
              schema.changelogGithubEvent.externalId,
            ],
            set: {
              sourceUrl: htmlUrl,
              prNumber: number,
              commitSha: mergeSha,
              payload: pr,
              eventTimestampMs: eventDate,
              lastSeenAt: now,
            },
          });
      })
      .filter((x) => x !== undefined);

    if (isTuple(upserts)) {
      await db.batch(upserts);
    }
  }
}
