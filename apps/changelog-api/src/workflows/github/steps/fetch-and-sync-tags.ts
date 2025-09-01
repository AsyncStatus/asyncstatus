import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import type { Endpoints } from "@octokit/types";
import { nanoid } from "nanoid";
import type { Octokit } from "octokit";
import { isTuple } from "../../../lib/is-tuple";

type ListTagsParameters = Endpoints["GET /repos/{owner}/{repo}/tags"]["parameters"];
type ListTagsItem = Endpoints["GET /repos/{owner}/{repo}/tags"]["response"]["data"][number];

type FetchAndSyncTagsParams = {
  octokit: Octokit;
  db: Db;
  owner: string;
  repo: string;
};

export async function fetchAndSyncTags({ octokit, db, owner, repo }: FetchAndSyncTagsParams) {
  const baseParams = { owner, repo, per_page: 100 } satisfies ListTagsParameters;

  for await (const page of octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/tags",
    baseParams,
  )) {
    const now = new Date();

    const upserts = page.data
      .map((tag: ListTagsItem) => {
        const name = tag.name?.trim();
        if (!name) return;

        const sha = tag.commit?.sha;
        const htmlUrl = `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(name)}`;

        return db
          .insert(schema.changelogGithubEvent)
          .values({
            id: nanoid(),
            repoOwner: owner,
            repoName: repo,
            sourceType: "tag",
            externalId: name,
            sourceUrl: htmlUrl,
            commitSha: sha,
            payload: tag,
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
              payload: tag,
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
