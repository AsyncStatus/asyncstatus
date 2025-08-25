import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { member } from "./member";
import { statusUpdate } from "./status-update";

export const statusGenerationJob = sqliteTable(
  "status_generation_job",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
    effectiveTo: integer("effective_to", { mode: "timestamp" }).notNull(),
    state: text("state").notNull(), // queued | running | done | error
    errorMessage: text("error_message"),
    statusUpdateId: text("status_update_id").references(() => statusUpdate.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
  },
  (t) => [index("status_job_member_idx").on(t.memberId), index("status_job_state_idx").on(t.state)],
);
