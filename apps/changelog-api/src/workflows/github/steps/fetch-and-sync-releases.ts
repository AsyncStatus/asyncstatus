import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { Endpoints } from "@octokit/types";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type ListReleasesParameters = Endpoints["GET /repos/{owner}/{repo}/releases"]["parameters"];
type ListReleasesItem = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"][number];

type FetchAndSyncReleasesParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
  repo: string;
};

export async function fetchAndSyncReleases({
  octokit,
  db,
  owner,
  repo,
}: FetchAndSyncReleasesParams) {
  const baseParams = { owner, repo, per_page: 10 } satisfies ListReleasesParameters;

  for await (const page of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/releases",
    baseParams,
  )) {
    const now = new Date();

    const upserts = page.data
      .map((release: ListReleasesItem) => {
        const tagName = release.tag_name?.trim();
        if (!tagName) return;

        const htmlUrl = release.html_url ?? undefined;
        const publishedAt = release.published_at ?? release.created_at ?? undefined;
        const eventDate = publishedAt ? new Date(publishedAt) : undefined;

        return db
          .insert(schema.changelogGithubEvent)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName: repo,
            sourceType: "release",
            externalId: tagName,
            sourceUrl: htmlUrl,
            payload: release,
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
              payload: release,
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
