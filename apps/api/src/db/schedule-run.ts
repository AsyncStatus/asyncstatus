import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { organization } from "./organization";
import { schedule } from "./schedule";

export const ScheduleStatus = z.enum([
  "active", // Schedule is active and running
  "paused", // Schedule is paused
  "completed", // One-time schedule that has completed
  "failed", // Schedule failed during execution
  "cancelled", // Schedule was cancelled
]);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

export const ScheduleExecutionStatus = z.enum(["success", "failed", "partial"]);
export type ScheduleExecutionStatus = z.infer<typeof ScheduleExecutionStatus>;

export const scheduleRun = sqliteTable(
  "schedule_run",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),

    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),

    status: text("status").notNull().$type<ScheduleStatus>().default("active"),
    nextExecutionAt: integer("next_execution_at", { mode: "timestamp_ms" }),
    lastExecutionAt: integer("last_execution_at", { mode: "timestamp_ms" }),
    lastExecutionStatus: text("last_execution_status").$type<ScheduleExecutionStatus>(),
    lastExecutionError: text("last_execution_error"),
    executionCount: integer("execution_count").notNull().default(0),
    executionMetadata: text("execution_metadata"),

    durableObjectId: text("durable_object_id"),
    alarmId: text("alarm_id"),
    maxRetries: integer("max_retries").default(3),
    currentRetries: integer("current_retries").default(0),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
  },
  (t) => [
    index("schedule_run_organization_id_index").on(t.organizationId),
    index("schedule_run_schedule_id_index").on(t.scheduleId),
    index("schedule_run_status_index").on(t.status),
    index("schedule_run_next_execution_index").on(t.nextExecutionAt),
    index("schedule_run_durable_object_index").on(t.durableObjectId),
  ],
);

export const ScheduleRun = createSelectSchema(scheduleRun, {
  status: ScheduleStatus,
  lastExecutionStatus: ScheduleExecutionStatus.optional(),
  maxRetries: z.number().min(0).max(10),
  currentRetries: z.number().min(0),
});
export type ScheduleRun = z.output<typeof ScheduleRun>;
export const ScheduleRunInsert = createInsertSchema(scheduleRun, {
  status: ScheduleStatus,
  lastExecutionStatus: ScheduleExecutionStatus.optional(),
  maxRetries: z.number().min(0).max(10),
  currentRetries: z.number().min(0),
});
export type ScheduleRunInsert = z.output<typeof ScheduleRunInsert>;
export const ScheduleRunUpdate = createUpdateSchema(scheduleRun, {
  status: ScheduleStatus,
  lastExecutionStatus: ScheduleExecutionStatus.optional(),
  maxRetries: z.number().min(0).max(10),
  currentRetries: z.number().min(0),
});
export type ScheduleRunUpdate = z.output<typeof ScheduleRunUpdate>;
