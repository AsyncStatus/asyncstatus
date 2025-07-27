import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { organization } from "./organization";

export const ScheduleActionType = z.enum(["reminder", "summary"]);
export type ScheduleActionType = z.infer<typeof ScheduleActionType>;

export const ScheduleRecurrence = z.enum([
  "once", // One-time execution
  "daily", // Every day
  "weekly", // Every week
  "monthly", // Every month
]);
export type ScheduleRecurrence = z.infer<typeof ScheduleRecurrence>;

export const DELIVERY_METHODS = ["email", "slack"] as const;
export const DeliveryMethod = z
  .string()
  .min(1, "At least one delivery method is required")
  .refine((val) => {
    const methods = val.split(",").map((m) => m.trim());
    return methods.every((method) => DELIVERY_METHODS.includes(method as any));
  }, "Invalid delivery method. Valid options: email, slack")
  .refine((val) => {
    const methods = val.split(",").map((m) => m.trim());
    return new Set(methods).size === methods.length;
  }, "Duplicate delivery methods are not allowed");

export type DeliveryMethod = z.infer<typeof DeliveryMethod>;

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

    actionType: text("action_type").notNull().$type<ScheduleActionType>(), // "reminder" or "summary"
    deliveryMethod: text("delivery_method").notNull(), // e.g. "email,slack" - comma-delimited

    recurrence: text("recurrence").notNull().$type<ScheduleRecurrence>(), // "once", "daily", "weekly", "monthly"
    timezone: text("timezone").notNull(), // IANA timezone like "America/New_York"
    dayOfWeek: integer("day_of_week"), // 0-6 for weekly (0 = Sunday), null for other recurrences
    dayOfMonth: integer("day_of_month"), // 1-31 for monthly, null for other recurrences
    timeOfDay: text("time_of_day").notNull(), // HH:MM format like "09:00"

    autoGenerateFromIntegrations: integer("auto_generate_from_integrations", {
      mode: "boolean",
    }).default(false),
    reminderMessageTemplate: text("reminder_message_template"),

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
  deliveryMethod: DeliveryMethod,
  recurrence: ScheduleRecurrence,
  timezone: z.string().min(1),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
});
export type Schedule = z.output<typeof Schedule>;
export const ScheduleInsert = createInsertSchema(schedule, {
  actionType: ScheduleActionType,
  deliveryMethod: DeliveryMethod,
  recurrence: ScheduleRecurrence,
  timezone: z.string().min(1),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
});
export type ScheduleInsert = z.output<typeof ScheduleInsert>;
export const ScheduleUpdate = createUpdateSchema(schedule, {
  actionType: ScheduleActionType,
  deliveryMethod: DeliveryMethod,
  recurrence: ScheduleRecurrence,
  timezone: z.string().min(1),
  timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
});
export type ScheduleUpdate = z.output<typeof ScheduleUpdate>;
