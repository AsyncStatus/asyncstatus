import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { changelog } from "./changelog";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const changelogGenerationJob = sqliteTable(
  "changelog_generation_job",
  {
    id: text("id").primaryKey(),

    inputUrl: text("input_url").notNull(),
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    branch: text("branch"),

    fromCommitSha: text("from_commit_sha"),
    toCommitSha: text("to_commit_sha"),
    rangeStart: integer("range_start", { mode: "timestamp_ms" }),
    rangeEnd: integer("range_end", { mode: "timestamp_ms" }),

    metadata: text("metadata", { mode: "json" }).$type<{ humanReadableStatus: string }>(),

    state: text("state").notNull(), // queued | running | done | error
    errorMessage: text("error_message"),
    errorAt: integer("error_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    finishedAt: integer("finished_at", { mode: "timestamp_ms" }),

    changelogId: text("changelog_id").references(() => changelog.id, { onDelete: "set null" }),
  },
  (t) => [
    index("changelog_job_repo_idx").on(t.repoOwner, t.repoName),
    index("changelog_job_state_idx").on(t.state),
    index("changelog_job_created_at_idx").on(t.createdAt),
    uniqueIndex("changelog_job_repo_active_unique")
      .on(t.repoOwner, t.repoName)
      .where(sql`state IN ('queued','running')`),
    uniqueIndex("changelog_job_repo_commit_active_unique")
      .on(t.repoOwner, t.repoName, t.fromCommitSha, t.toCommitSha)
      .where(
        sql`state IN ('queued','running') AND from_commit_sha IS NOT NULL AND to_commit_sha IS NOT NULL`,
      ),
    uniqueIndex("changelog_job_repo_date_active_unique")
      .on(t.repoOwner, t.repoName, t.rangeStart, t.rangeEnd)
      .where(
        sql`state IN ('queued','running') AND range_start IS NOT NULL AND range_end IS NOT NULL`,
      ),
  ],
);

export const ChangelogGenerationJob = createSelectSchema(changelogGenerationJob, {
  inputUrl: z.url({ hostname: /github\.com/, pattern: /\/[\w-]+\/[\w-]+/i, protocol: /https/i }),
});
export type ChangelogGenerationJob = z.output<typeof ChangelogGenerationJob>;
export const ChangelogGenerationJobInsert = createInsertSchema(changelogGenerationJob, {
  inputUrl: z.url({ hostname: /github\.com/, pattern: /\/[\w-]+\/[\w-]+/i, protocol: /https/i }),
});
export type ChangelogGenerationJobInsert = z.output<typeof ChangelogGenerationJobInsert>;
export const ChangelogGenerationJobUpdate = createUpdateSchema(changelogGenerationJob, {
  inputUrl: z.url({ hostname: /github\.com/, pattern: /\/[\w-]+\/[\w-]+/i, protocol: /https/i }),
});
export type ChangelogGenerationJobUpdate = z.output<typeof ChangelogGenerationJobUpdate>;
