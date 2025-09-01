import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { changelogGithubContributor } from "./changelog-github-contributor";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const changelogGithubRepoContributor = sqliteTable(
  "changelog_github_repo_contributor",
  {
    id: text("id").primaryKey(),

    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),

    contributorLogin: text("contributor_login")
      .notNull()
      .references(() => changelogGithubContributor.login, { onDelete: "cascade" }),

    commitCount: integer("commit_count").notNull().default(0),
    prCount: integer("pr_count").notNull().default(0),
    issueCount: integer("issue_count").notNull().default(0),
    firstTimeContributor: integer("first_time_contributor", { mode: "boolean" })
      .notNull()
      .default(false),

    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("chg_repo_contrib_repo_idx").on(t.repoOwner, t.repoName),
    index("chg_repo_contrib_last_seen_idx").on(t.repoOwner, t.repoName, t.lastSeenAt),
    uniqueIndex("chg_repo_contrib_unique").on(t.repoOwner, t.repoName, t.contributorLogin),
  ],
);

export const ChangelogGithubRepoContributor = createSelectSchema(changelogGithubRepoContributor);
export type ChangelogGithubRepoContributor = z.output<typeof ChangelogGithubRepoContributor>;
export const ChangelogGithubRepoContributorInsert = createInsertSchema(
  changelogGithubRepoContributor,
);
export type ChangelogGithubRepoContributorInsert = z.output<
  typeof ChangelogGithubRepoContributorInsert
>;
export const ChangelogGithubRepoContributorUpdate = createUpdateSchema(
  changelogGithubRepoContributor,
);
export type ChangelogGithubRepoContributorUpdate = z.output<
  typeof ChangelogGithubRepoContributorUpdate
>;
