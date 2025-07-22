import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { slackChannel } from "./slack-channel";
import { slackUser } from "./slack-user";

export const slackEvent = sqliteTable(
  "slack_event",
  {
    id: text("id").primaryKey(),
    slackEventId: text("slack_event_id").notNull().unique(),
    slackUserId: text("slack_user_id").references(() => slackUser.id, { onDelete: "cascade" }),
    channelId: text("channel_id").references(() => slackChannel.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: text("payload", { mode: "json" }),
    messageTs: text("message_ts"), // Slack message timestamp (for message events)
    threadTs: text("thread_ts"), // Thread timestamp (if in thread)
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(), // When event occurred in Slack
    insertedAt: integer("inserted_at", { mode: "timestamp" }).notNull(), // When we stored it
  },
  (t) => [
    index("slack_event_channel_id_idx").on(t.channelId),
    index("slack_event_created_at_idx").on(t.createdAt),
    index("slack_event_slack_event_id_idx").on(t.slackEventId),
    index("slack_event_slack_user_id_idx").on(t.slackUserId),
    index("slack_event_type_idx").on(t.type),
    index("slack_event_message_ts_idx").on(t.messageTs),
  ],
);

export const SlackEvent = createSelectSchema(slackEvent, {
  slackEventId: z.string().trim().min(1),
  slackUserId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type SlackEvent = z.output<typeof SlackEvent>;
export const SlackEventInsert = createInsertSchema(slackEvent, {
  slackEventId: z.string().trim().min(1),
  slackUserId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type SlackEventInsert = z.output<typeof SlackEventInsert>;
export const SlackEventUpdate = createUpdateSchema(slackEvent, {
  slackEventId: z.string().trim().min(1),
  slackUserId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type SlackEventUpdate = z.output<typeof SlackEventUpdate>;
