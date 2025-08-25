import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { discordChannel } from "./discord-channel";
import { discordServer } from "./discord-server";
import { discordUser } from "./discord-user";

export const discordEvent = sqliteTable(
  "discord_event",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => discordServer.id, { onDelete: "cascade" }),
    discordEventId: text("discord_event_id").notNull().unique(), // Unique event ID
    discordUserId: text("discord_user_id").references(() => discordUser.discordUserId, {
      onDelete: "cascade",
    }),
    channelId: text("channel_id").references(() => discordChannel.channelId, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(), // Discord event type (MESSAGE_CREATE, MESSAGE_UPDATE, etc.)
    payload: text("payload", { mode: "json" }), // Full event payload
    messageId: text("message_id"), // Message ID (for message events)
    threadId: text("thread_id"), // Thread ID (if in thread)
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(), // When event occurred in Discord
    insertedAt: integer("inserted_at", { mode: "timestamp" }).notNull(), // When we stored it
  },
  (t) => [
    index("discord_event_server_id_idx").on(t.serverId),
    index("discord_event_channel_id_idx").on(t.channelId),
    index("discord_event_created_at_idx").on(t.createdAt),
    index("discord_event_discord_event_id_idx").on(t.discordEventId),
    index("discord_event_discord_user_id_idx").on(t.discordUserId),
    index("discord_event_type_idx").on(t.type),
    index("discord_event_message_id_idx").on(t.messageId),
  ],
);

export const DiscordEvent = createSelectSchema(discordEvent, {
  discordEventId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type DiscordEvent = z.output<typeof DiscordEvent>;
export const DiscordEventInsert = createInsertSchema(discordEvent, {
  discordEventId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type DiscordEventInsert = z.output<typeof DiscordEventInsert>;
export const DiscordEventUpdate = createUpdateSchema(discordEvent, {
  discordEventId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type DiscordEventUpdate = z.output<typeof DiscordEventUpdate>;
