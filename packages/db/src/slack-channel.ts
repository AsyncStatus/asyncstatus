import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { slackIntegration } from "./slack-integration";

export const slackChannel = sqliteTable(
  "slack_channel",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => slackIntegration.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull().unique(), // Slack's channel ID (C1234567890)
    name: text("name").notNull(), // Channel name without #
    isPrivate: integer("is_private", { mode: "boolean" }).notNull(), // Is the channel private
    isArchived: integer("is_archived", { mode: "boolean" }).default(false), // Is the channel archived
    isGeneral: integer("is_general", { mode: "boolean" }).default(false), // Is the general channel
    isIm: integer("is_im", { mode: "boolean" }).default(false), // Is a direct message channel
    isMpim: integer("is_mpim", { mode: "boolean" }).default(false), // Is a group direct message channel
    isGroup: integer("is_group", { mode: "boolean" }).default(false), // Is a group channel
    isShared: integer("is_shared", { mode: "boolean" }).default(false), // Is the channel shared
    purpose: text("purpose"), // Channel purpose
    topic: text("topic"), // Channel topic
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("slack_channel_integration_id_index").on(t.integrationId),
    index("slack_channel_channel_id_index").on(t.channelId),
    index("slack_channel_name_index").on(t.name),
  ],
);

export const SlackChannel = createSelectSchema(slackChannel, {
  channelId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type SlackChannel = z.output<typeof SlackChannel>;
export const SlackChannelInsert = createInsertSchema(slackChannel, {
  channelId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type SlackChannelInsert = z.output<typeof SlackChannelInsert>;
export const SlackChannelUpdate = createUpdateSchema(slackChannel, {
  channelId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type SlackChannelUpdate = z.output<typeof SlackChannelUpdate>;
