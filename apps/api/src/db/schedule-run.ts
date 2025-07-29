import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { schedule } from "./schedule";

export const ScheduleStatus = z.enum([
  "pending",
  "running",
  "partial",
  "completed",
  "failed",
  "cancelled",
]);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

export const scheduleRun = sqliteTable(
  "schedule_run",
  {
    id: text("id").primaryKey(),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    createdByMemberId: text("created_by_member_id").references(() => member.id, {
      onDelete: "cascade",
    }),

    status: text("status").notNull().$type<ScheduleStatus>().default("pending"),
    nextExecutionAt: integer("next_execution_at", { mode: "timestamp_ms" }),
    lastExecutionAt: integer("last_execution_at", { mode: "timestamp_ms" }),
    lastExecutionError: text("last_execution_error"),
    executionCount: integer("execution_count").notNull().default(0),
    executionMetadata: text("execution_metadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
  },
  (t) => [
    index("schedule_run_schedule_id_index").on(t.scheduleId),
    index("schedule_run_status_index").on(t.status),
    index("schedule_run_next_execution_index").on(t.nextExecutionAt),
  ],
);

export const ScheduleRun = createSelectSchema(scheduleRun, {
  status: ScheduleStatus,
  executionMetadata: z.record(z.string(), z.unknown()).nullable(),
});
export type ScheduleRun = z.output<typeof ScheduleRun>;
export const ScheduleRunInsert = createInsertSchema(scheduleRun, {
  status: ScheduleStatus,
  executionMetadata: z.record(z.string(), z.unknown()).nullable(),
});
export type ScheduleRunInsert = z.output<typeof ScheduleRunInsert>;
export const ScheduleRunUpdate = createUpdateSchema(scheduleRun, {
  status: ScheduleStatus,
  executionMetadata: z.record(z.string(), z.unknown()).nullable(),
});
export type ScheduleRunUpdate = z.output<typeof ScheduleRunUpdate>;
