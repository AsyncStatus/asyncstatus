import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { DiscordChannel } from "./discord-channel";
import { DiscordIntegration } from "./discord-integration";
import { GithubIntegration } from "./github-integration";
import { Member, member } from "./member";
import { Organization, organization } from "./organization";
import { SlackChannel } from "./slack-channel";
import { SlackIntegration } from "./slack-integration";
import { Team } from "./team";

const ScheduleConfigDeliveryMethod = z
  .discriminatedUnion("type", [
    z.strictObject({
      type: z.literal("organization"),
      value: Organization.shape.slug, // everyone's email
    }),
    z.strictObject({
      type: z.literal("member"),
      value: Member.shape.id, // member email
    }),
    z.strictObject({
      type: z.literal("team"),
      value: Team.shape.id, // every team member's email
    }),
    z.strictObject({
      type: z.literal("customEmail"),
      value: z.string(), // custom email
    }),
    z.strictObject({
      type: z.literal("slack"),
      value: SlackChannel.shape.channelId, // slack channel
    }),
    z.strictObject({
      type: z.literal("discord"),
      value: DiscordChannel.shape.channelId, // discord channel
    }),
  ])
  .or(z.undefined());

export const ScheduleConfigRemindToPostUpdates = z.strictObject({
  name: z.literal("remindToPostUpdates"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  deliveryMethods: z.array(ScheduleConfigDeliveryMethod),
});
export type ScheduleConfigRemindToPostUpdates = z.infer<typeof ScheduleConfigRemindToPostUpdates>;

export const ScheduleConfigGenerateUpdates = z.strictObject({
  name: z.literal("generateUpdates"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  generateFor: z.array(
    z
      .discriminatedUnion("type", [
        z.strictObject({
          type: z.literal("organization"),
          value: Organization.shape.slug, // everyone
          usingActivityFrom: z
            .enum(["anyIntegration", "slack", "github", "discord"])
            .array()
            .default(["anyIntegration"]),
        }),
        z.strictObject({
          type: z.literal("member"),
          value: Member.shape.id, // member
          usingActivityFrom: z
            .enum(["anyIntegration", "slack", "github", "discord"])
            .array()
            .default(["anyIntegration"]),
        }),
        z.strictObject({
          type: z.literal("team"),
          value: Team.shape.id, // every team member
          usingActivityFrom: z
            .enum(["anyIntegration", "slack", "github", "discord"])
            .array()
            .default(["anyIntegration"]),
        }),
        z.strictObject({
          type: z.literal("slack"),
          value: SlackIntegration.shape.id, // any slack activity
        }),
        z.strictObject({
          type: z.literal("github"),
          value: GithubIntegration.shape.id, // any github activity
        }),
        z.strictObject({
          type: z.literal("discord"),
          value: DiscordIntegration.shape.id, // any discord activity
        }),
      ])
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
  deliveryMethods: z.array(ScheduleConfigDeliveryMethod),
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
