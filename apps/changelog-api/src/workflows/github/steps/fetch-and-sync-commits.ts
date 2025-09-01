import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { Endpoints } from "@octokit/types";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type ListCommitsParameters = Endpoints["GET /repos/{owner}/{repo}/commits"]["parameters"];

type FetchAndSyncCommitsParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
  repo: string;
  since?: Date;
  until?: Date;
  headSha?: string;
};

export async function fetchAndSyncCommits({
  octokit,
  db,
  owner,
  repo,
  since,
  until,
  headSha,
}: FetchAndSyncCommitsParams) {
  const baseParams = {
    owner,
    repo,
    per_page: 100,
    ...(since ? { since: since.toISOString() } : {}),
    ...(until ? { until: until.toISOString() } : {}),
    ...(headSha ? { sha: headSha } : {}),
  } satisfies ListCommitsParameters;

  for await (const page of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/commits",
    baseParams,
  )) {
    const now = new Date();

    const upserts = page.data
      .map((commit) => {
        const sha = commit.sha;
        const authorDateStr = commit.commit?.author?.date;
        const committerDateStr = commit.commit?.committer?.date;
        const htmlUrl = commit.html_url;
        const eventDate = authorDateStr
          ? new Date(authorDateStr)
          : committerDateStr
            ? new Date(committerDateStr)
            : undefined;

        return db
          .insert(schema.changelogGithubEvent)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName: repo,
            sourceType: "commit",
            externalId: sha,
            sourceUrl: htmlUrl,
            commitSha: sha,
            payload: commit,
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
              commitSha: sha,
              payload: commit,
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
