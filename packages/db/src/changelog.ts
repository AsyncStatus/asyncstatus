import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const changelog = sqliteTable(
  "changelog",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),

    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    repoFullName: text("repo_full_name").notNull(),
    repoUrl: text("repo_url").notNull(),

    fromCommitSha: text("from_commit_sha"),
    toCommitSha: text("to_commit_sha"),
    rangeStart: integer("range_start", { mode: "timestamp_ms" }),
    rangeEnd: integer("range_end", { mode: "timestamp_ms" }),

    // markdown content
    content: text("content").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("changelog_slug_idx").on(t.slug),
    index("changelog_repo_idx").on(t.repoOwner, t.repoName),
    index("changelog_created_at_idx").on(t.createdAt),
    uniqueIndex("changelog_slug_unique").on(t.slug),
    uniqueIndex("changelog_repo_commit_range_unique")
      .on(t.repoOwner, t.repoName, t.fromCommitSha, t.toCommitSha)
      .where(sql`from_commit_sha IS NOT NULL AND to_commit_sha IS NOT NULL`),
    uniqueIndex("changelog_repo_date_range_unique")
      .on(t.repoOwner, t.repoName, t.rangeStart, t.rangeEnd)
      .where(sql`range_start IS NOT NULL AND range_end IS NOT NULL`),
  ],
);

export const Changelog = createSelectSchema(changelog);
export type Changelog = z.output<typeof Changelog>;
export const ChangelogInsert = createInsertSchema(changelog);
export type ChangelogInsert = z.output<typeof ChangelogInsert>;
export const ChangelogUpdate = createUpdateSchema(changelog);
export type ChangelogUpdate = z.output<typeof ChangelogUpdate>;
