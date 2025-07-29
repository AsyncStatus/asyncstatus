import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { scheduleRun } from "./schedule-run";

export const ScheduleRunTaskStatus = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);
export type ScheduleRunTaskStatus = z.infer<typeof ScheduleRunTaskStatus>;

export const scheduleRunTask = sqliteTable(
  "schedule_run_task",
  {
    id: text("id").primaryKey(),
    scheduleRunId: text("schedule_run_id")
      .notNull()
      .references(() => scheduleRun.id, { onDelete: "cascade" }),
    status: text("status").notNull().$type<ScheduleRunTaskStatus>().default("pending"),
    results: text("results", { mode: "json" }).$type<Record<string, unknown>>(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (t) => [
    index("schedule_run_task_schedule_run_id").on(t.scheduleRunId),
    index("schedule_run_task_status").on(t.status),
  ],
);

export const ScheduleRunTask = createSelectSchema(scheduleRunTask, {
  status: ScheduleRunTaskStatus,
  results: z.record(z.string(), z.unknown()),
});
export type ScheduleRunTask = z.output<typeof ScheduleRunTask>;

export const ScheduleRunTaskInsert = createInsertSchema(scheduleRunTask, {
  status: ScheduleRunTaskStatus,
  results: z.record(z.string(), z.unknown()),
});
export type ScheduleRunTaskInsert = z.output<typeof ScheduleRunTaskInsert>;

export const ScheduleRunTaskUpdate = createUpdateSchema(scheduleRunTask, {
  status: ScheduleRunTaskStatus,
  results: z.record(z.string(), z.unknown()),
});
export type ScheduleRunTaskUpdate = z.output<typeof ScheduleRunTaskUpdate>;
