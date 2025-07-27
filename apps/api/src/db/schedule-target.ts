import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { schedule } from "./schedule";
import { slackChannel } from "./slack-channel";
import { team } from "./team";

export const ScheduleTargetType = z.enum([
  "organization", // All members in the organization
  "team", // All members in a specific team
  "member", // Specific member
  "slack_channel", // Specific Slack channel (for summaries)
]);
export type ScheduleTargetType = z.infer<typeof ScheduleTargetType>;

export const scheduleTarget = sqliteTable(
  "schedule_target",
  {
    id: text("id").primaryKey(),

    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull().$type<ScheduleTargetType>(),

    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    memberId: text("member_id").references(() => member.id, { onDelete: "cascade" }),
    slackChannelId: text("slack_channel_id").references(() => slackChannel.id, {
      onDelete: "cascade",
    }),

    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("schedule_target_schedule_id_index").on(t.scheduleId),
    index("schedule_target_type_index").on(t.targetType),
    index("schedule_target_team_id_index").on(t.teamId),
    index("schedule_target_member_id_index").on(t.memberId),
    index("schedule_target_slack_channel_id_index").on(t.slackChannelId),
  ],
);

export const ScheduleTarget = createSelectSchema(scheduleTarget, {
  targetType: ScheduleTargetType,
});
export type ScheduleTarget = z.output<typeof ScheduleTarget>;
export const ScheduleTargetInsert = createInsertSchema(scheduleTarget, {
  targetType: ScheduleTargetType,
});
export type ScheduleTargetInsert = z.output<typeof ScheduleTargetInsert>;
export const ScheduleTargetUpdate = createUpdateSchema(scheduleTarget, {
  targetType: ScheduleTargetType,
});
export type ScheduleTargetUpdate = z.output<typeof ScheduleTargetUpdate>;
