import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { schedule } from "./schedule";
import { slackChannel } from "./slack-channel";
import { team } from "./team";

export const ScheduleDeliveryTargetType = z.enum([
  "organization", // All members in the organization
  "team", // All members in a specific team
  "member", // Specific member
  "slack_channel", // Specific Slack channel
]);
export type ScheduleDeliveryTargetType = z.infer<typeof ScheduleDeliveryTargetType>;

export const scheduleDeliveryTarget = sqliteTable(
  "schedule_delivery_target",
  {
    id: text("id").primaryKey(),

    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull().$type<ScheduleDeliveryTargetType>(),

    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    memberId: text("member_id").references(() => member.id, { onDelete: "cascade" }),
    slackChannelId: text("slack_channel_id").references(() => slackChannel.id, {
      onDelete: "cascade",
    }),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("schedule_delivery_target_schedule_id_index").on(t.scheduleId),
    index("schedule_delivery_target_type_index").on(t.targetType),
    index("schedule_delivery_target_team_id_index").on(t.teamId),
    index("schedule_delivery_target_member_id_index").on(t.memberId),
    index("schedule_delivery_target_slack_channel_id_index").on(t.slackChannelId),
  ],
);

export const ScheduleDeliveryTarget = createSelectSchema(scheduleDeliveryTarget, {
  targetType: ScheduleDeliveryTargetType,
});
export type ScheduleDeliveryTarget = z.output<typeof ScheduleDeliveryTarget>;
export const ScheduleDeliveryTargetInsert = createInsertSchema(scheduleDeliveryTarget, {
  targetType: ScheduleDeliveryTargetType,
});
export type ScheduleDeliveryTargetInsert = z.output<typeof ScheduleDeliveryTargetInsert>;
export const ScheduleDeliveryTargetUpdate = createUpdateSchema(scheduleDeliveryTarget, {
  targetType: ScheduleDeliveryTargetType,
});
export type ScheduleDeliveryTargetUpdate = z.output<typeof ScheduleDeliveryTargetUpdate>;
