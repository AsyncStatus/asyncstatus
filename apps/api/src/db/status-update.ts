import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { organization } from "./organization";
import { team } from "./team";

export const statusUpdate = sqliteTable(
  "status_update",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    editorJson: text("editor_json", { mode: "json" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
    effectiveTo: integer("effective_to", { mode: "timestamp" }).notNull(),
    mood: text("mood"),
    emoji: text("emoji"),
    notes: text("notes"),
    isDraft: integer("is_draft", { mode: "boolean" }).notNull().default(true),
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("status_update_member_id_index").on(t.memberId),
    index("status_update_organization_id_index").on(t.organizationId),
    index("status_update_team_id_index").on(t.teamId),
    index("status_update_created_at_index").on(t.createdAt),
    index("status_update_effective_from_index").on(t.effectiveFrom),
    index("status_update_effective_to_index").on(t.effectiveTo),
    index("status_update_is_draft_index").on(t.isDraft),
  ],
);

export const StatusUpdate = createSelectSchema(statusUpdate);
export type StatusUpdate = z.output<typeof StatusUpdate>;
export const StatusUpdateInsert = createInsertSchema(statusUpdate);
export type StatusUpdateInsert = z.output<typeof StatusUpdateInsert>;
export const StatusUpdateUpdate = createUpdateSchema(statusUpdate);
export type StatusUpdateUpdate = z.output<typeof StatusUpdateUpdate>;
