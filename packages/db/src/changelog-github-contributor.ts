import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const changelogGithubContributor = sqliteTable(
  "changelog_github_contributor",
  {
    id: text("id").primaryKey(),
    login: text("login").notNull(),
    githubUserId: text("github_user_id"), // optional when author cannot be resolved to a GitHub account
    name: text("name"),
    avatarUrl: text("avatar_url"),
    htmlUrl: text("html_url"),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    uniqueIndex("chg_github_contributor_login_unique").on(t.login),
    uniqueIndex("chg_github_contributor_user_id_unique").on(t.githubUserId),
  ],
);

export const ChangelogGithubContributor = createSelectSchema(changelogGithubContributor);
export type ChangelogGithubContributor = z.output<typeof ChangelogGithubContributor>;
export const ChangelogGithubContributorInsert = createInsertSchema(changelogGithubContributor, {
  login: z.string().min(1).toLowerCase().trim(),
});
export type ChangelogGithubContributorInsert = z.output<typeof ChangelogGithubContributorInsert>;
export const ChangelogGithubContributorUpdate = createUpdateSchema(changelogGithubContributor, {
  login: z.string().min(1).toLowerCase().trim(),
});
export type ChangelogGithubContributorUpdate = z.output<typeof ChangelogGithubContributorUpdate>;
