import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const changelogGithubRepository = sqliteTable(
  "changelog_github_repository",
  {
    id: text("id").primaryKey(),

    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),

    fullName: text("full_name"),
    htmlUrl: text("html_url"),
    description: text("description"),
    defaultBranch: text("default_branch"),
    homepage: text("homepage"),
    language: text("language"),
    license: text("license"),

    isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(false),
    isFork: integer("is_fork", { mode: "boolean" }).notNull().default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),

    forksCount: integer("forks_count").notNull().default(0),
    stargazersCount: integer("stargazers_count").notNull().default(0),
    watchersCount: integer("watchers_count").notNull().default(0),
    openIssuesCount: integer("open_issues_count").notNull().default(0),

    pushedAt: integer("pushed_at", { mode: "timestamp_ms" }),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("chg_gh_repo_owner_name_idx").on(t.repoOwner, t.repoName),
    uniqueIndex("chg_gh_repo_owner_name_unique").on(t.repoOwner, t.repoName),
  ],
);

export const ChangelogGithubRepository = createSelectSchema(changelogGithubRepository);
export type ChangelogGithubRepository = z.output<typeof ChangelogGithubRepository>;
export const ChangelogGithubRepositoryInsert = createInsertSchema(changelogGithubRepository);
export type ChangelogGithubRepositoryInsert = z.output<typeof ChangelogGithubRepositoryInsert>;
export const ChangelogGithubRepositoryUpdate = createUpdateSchema(changelogGithubRepository);
export type ChangelogGithubRepositoryUpdate = z.output<typeof ChangelogGithubRepositoryUpdate>;
