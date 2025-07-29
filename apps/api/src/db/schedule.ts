import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { Member, member } from "./member";
import { organization } from "./organization";
import { SlackChannel } from "./slack-channel";
import { Team } from "./team";

export const ScheduleConfigRemindToPostUpdates = z.strictObject({
  name: z.literal("remindToPostUpdates"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  deliverToEveryone: z.boolean().default(false),
  deliveryMethods: z.array(
    z
      .strictObject({
        type: z.enum(["member", "slack", "team"]),
        value: Member.shape.id.or(SlackChannel.shape.channelId).or(Team.shape.id),
      })
      .or(z.undefined()),
  ),
});
export type ScheduleConfigRemindToPostUpdates = z.infer<typeof ScheduleConfigRemindToPostUpdates>;

export const ScheduleConfigGenerateUpdates = z.strictObject({
  name: z.literal("generateUpdates"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  generateForEveryMember: z.boolean().default(false),
  generateFor: z.array(
    z
      .strictObject({ type: z.enum(["member", "team"]), value: Member.shape.id.or(Team.shape.id) })
      .or(z.undefined()),
  ),
});
export type ScheduleConfigGenerateUpdates = z.infer<typeof ScheduleConfigGenerateUpdates>;

export const ScheduleConfigSendSummaries = z.strictObject({
  name: z.literal("sendSummaries"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  deliverToEveryone: z.boolean().default(false),
  deliveryMethods: z.array(
    z
      .strictObject({
        type: z.enum(["member", "slack", "team"]),
        value: Member.shape.id.or(SlackChannel.shape.channelId).or(Team.shape.id),
      })
      .or(z.undefined()),
  ),
});
export type ScheduleConfigSendSummaries = z.infer<typeof ScheduleConfigSendSummaries>;

export const ScheduleConfig = z.discriminatedUnion("name", [
  ScheduleConfigRemindToPostUpdates,
  ScheduleConfigGenerateUpdates,
  ScheduleConfigSendSummaries,
]);
export type ScheduleConfig = z.infer<typeof ScheduleConfig>;

export const ScheduleName = z.enum(["remindToPostUpdates", "generateUpdates", "sendSummaries"]);
export type ScheduleName = z.infer<typeof ScheduleName>;

export const schedule = sqliteTable(
  "schedule",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMemberId: text("created_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull().$type<ScheduleName>(),
    config: text("config", { mode: "json" }).notNull().$type<ScheduleConfig>(),

    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("schedule_organization_id_index").on(t.organizationId),
    index("schedule_created_by_member_id_index").on(t.createdByMemberId),
    index("schedule_active_index").on(t.isActive),
    index("schedule_name_index").on(t.name),
  ],
);

export const Schedule = createSelectSchema(schedule, {
  name: ScheduleName,
  config: ScheduleConfig,
});
export type Schedule = z.output<typeof Schedule>;
export const ScheduleInsert = createInsertSchema(schedule, {
  name: ScheduleName,
  config: ScheduleConfig,
});
export type ScheduleInsert = z.output<typeof ScheduleInsert>;
export const ScheduleUpdate = createUpdateSchema(schedule, {
  name: ScheduleName,
  config: ScheduleConfig,
});
export type ScheduleUpdate = z.output<typeof ScheduleUpdate>;
