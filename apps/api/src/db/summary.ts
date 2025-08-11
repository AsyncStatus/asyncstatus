import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";
import { team } from "./team";
import { user } from "./user";

const summaryType = z.enum([
  "organization_status_updates",
  "team_status_updates",
  "user_status_updates",
  "github_activity",
  "slack_activity",
  "discord_activity",
]);

export const summary = sqliteTable(
  "summary",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    type: text("type").notNull().$type<z.infer<typeof summaryType>>(),
    effectiveFrom: integer("effective_from", { mode: "timestamp_ms" }).notNull(),
    effectiveTo: integer("effective_to", { mode: "timestamp_ms" }).notNull(),
    content: text("content", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("summary_org_idx").on(t.organizationId),
    index("summary_team_idx").on(t.teamId),
    index("summary_user_idx").on(t.userId),
    index("summary_type_idx").on(t.type),
    index("summary_range_idx").on(t.effectiveFrom, t.effectiveTo),
    uniqueIndex("summary_slug_unique").on(t.slug).where(sql`slug IS NOT NULL`),
  ],
);

export const Summary = createSelectSchema(summary, {
  type: summaryType,
});
export type Summary = z.output<typeof Summary>;

export const SummaryInsert = createInsertSchema(summary, {
  type: summaryType,
});
export type SummaryInsert = z.output<typeof SummaryInsert>;

export const SummaryUpdate = createUpdateSchema(summary, {
  type: summaryType,
});
export type SummaryUpdate = z.output<typeof SummaryUpdate>;
