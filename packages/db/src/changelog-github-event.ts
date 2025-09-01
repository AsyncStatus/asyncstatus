import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const changelogGithubEvent = sqliteTable(
  "changelog_github_event",
  {
    id: text("id").primaryKey(),
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    // 'commit' | 'pull_request' | 'issue' | 'release'
    sourceType: text("source_type").notNull(),
    // stable external id, e.g. full commit SHA, PR number, issue number, release tag
    externalId: text("external_id").notNull(),
    sourceUrl: text("source_url"),
    // convenience columns for filtering/indexing
    commitSha: text("commit_sha"),
    prNumber: integer("pr_number"),
    issueNumber: integer("issue_number"),
    releaseTag: text("release_tag"),
    payload: text("payload", { mode: "json" }).$type<unknown>(),
    // provider event time (e.g., committedDate/mergedAt/createdAt)
    eventTimestampMs: integer("event_timestamp_ms", { mode: "timestamp_ms" }),
    insertedAt: integer("inserted_at", { mode: "timestamp_ms" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),
  },
  (t) => [
    index("chg_gh_event_repo_idx").on(t.repoOwner, t.repoName),
    index("chg_gh_event_repo_ts_idx").on(t.repoOwner, t.repoName, t.eventTimestampMs),
    index("chg_gh_event_type_idx").on(t.sourceType),
    index("chg_gh_event_commit_idx").on(t.commitSha),
    uniqueIndex("chg_gh_event_unique").on(t.repoOwner, t.repoName, t.sourceType, t.externalId),
  ],
);

export const ChangelogGithubEvent = createSelectSchema(changelogGithubEvent);
export type ChangelogGithubEvent = z.output<typeof ChangelogGithubEvent>;
export const ChangelogGithubEventInsert = createInsertSchema(changelogGithubEvent);
export type ChangelogGithubEventInsert = z.output<typeof ChangelogGithubEventInsert>;
export const ChangelogGithubEventUpdate = createUpdateSchema(changelogGithubEvent);
export type ChangelogGithubEventUpdate = z.output<typeof ChangelogGithubEventUpdate>;
