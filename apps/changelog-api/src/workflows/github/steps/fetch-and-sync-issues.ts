import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { Endpoints } from "@octokit/types";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type ListIssuesParameters = Endpoints["GET /repos/{owner}/{repo}/issues"]["parameters"];
type ListIssuesItem = Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"][number];

type FetchAndSyncIssuesParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
  repo: string;
  since?: Date;
};

export async function fetchAndSyncIssues({
  octokit,
  db,
  owner,
  repo,
  since,
}: FetchAndSyncIssuesParams) {
  const baseParams = {
    owner,
    repo,
    per_page: 10,
    state: "all",
    sort: "updated",
    direction: "desc",
  } satisfies ListIssuesParameters;

  for await (const page of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/issues",
    baseParams,
  )) {
    const now = new Date();

    const filtered = page.data.filter((it: ListIssuesItem) => {
      // Exclude PRs from this endpoint; PRs are handled separately
      if ("pull_request" in (it as object)) return false;
      if (!since) return true;
      const closedAt = it.closed_at ? new Date(it.closed_at) : undefined;
      const updatedAt = it.updated_at ? new Date(it.updated_at) : undefined;
      const createdAt = it.created_at ? new Date(it.created_at) : undefined;
      const candidate = closedAt ?? updatedAt ?? createdAt ?? new Date(0);
      return candidate >= since;
    });

    const upserts = filtered
      .map((it: ListIssuesItem) => {
        const number = it.number;
        const externalId = String(number);
        const closedAt = it.closed_at ? new Date(it.closed_at) : undefined;
        const updatedAt = it.updated_at ? new Date(it.updated_at) : undefined;
        const createdAt = it.created_at ? new Date(it.created_at) : undefined;
        const eventDate = closedAt ?? updatedAt ?? createdAt;
        const htmlUrl = it.html_url ?? undefined;

        return db
          .insert(schema.changelogGithubEvent)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName: repo,
            sourceType: "issue",
            externalId,
            sourceUrl: htmlUrl,
            issueNumber: number,
            payload: it,
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
              issueNumber: number,
              payload: it,
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
