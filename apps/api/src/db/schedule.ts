import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { organization } from "./organization";

export const ScheduleActionType = z.enum(["pingForUpdates", "generateUpdates", "sendSummaries"]);
export type ScheduleActionType = z.infer<typeof ScheduleActionType>;

export const ScheduleRecurrence = z.enum([
  "daily", // Every day
  "weekly", // Every week
  "monthly", // Every month
]);
export type ScheduleRecurrence = z.infer<typeof ScheduleRecurrence>;

export const schedule = sqliteTable(
  "schedule",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMemberId: text("created_by_member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),

    actionType: text("action_type").notNull().$type<ScheduleActionType>(),

    recurrence: text("recurrence").notNull().$type<ScheduleRecurrence>(),
    timezone: text("timezone").notNull(), // IANA timezone like "America/New_York"
    dayOfWeek: integer("day_of_week"), // 0-6 for weekly (0 = Monday), null for other recurrences
    dayOfMonth: integer("day_of_month"), // 1-28 for monthly, null for other recurrences
    timeOfDay: text("time_of_day").notNull(), // HH:MM format like "09:00"

    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("schedule_organization_id_index").on(t.organizationId),
    index("schedule_action_type_index").on(t.actionType),
    index("schedule_active_index").on(t.isActive),
  ],
);

export const Schedule = createSelectSchema(schedule, {
  actionType: ScheduleActionType,
  recurrence: ScheduleRecurrence,
  timezone: z.string().min(1),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
});
export type Schedule = z.output<typeof Schedule>;
export const ScheduleInsert = createInsertSchema(schedule, {
  actionType: ScheduleActionType,
  recurrence: ScheduleRecurrence,
  timezone: z.string().min(1),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
});
export type ScheduleInsert = z.output<typeof ScheduleInsert>;
export const ScheduleUpdate = createUpdateSchema(schedule, {
  actionType: ScheduleActionType,
  recurrence: ScheduleRecurrence,
  timezone: z.string().min(1),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(28).optional(),
});
export type ScheduleUpdate = z.output<typeof ScheduleUpdate>;
