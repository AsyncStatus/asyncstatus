import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { discordServer } from "./discord-server";

export const discordChannel = sqliteTable(
  "discord_channel",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => discordServer.id, { onDelete: "cascade" }),
    channelId: text("channel_id").notNull().unique(), // Discord channel ID
    guildId: text("guild_id").notNull(), // Discord server ID (for quick lookups)
    name: text("name").notNull(),
    type: integer("type").notNull(), // Discord channel type (0 = text, 2 = voice, etc.)
    position: integer("position"),
    parentId: text("parent_id"), // Category ID if in a category
    topic: text("topic"),
    nsfw: integer("nsfw", { mode: "boolean" }).default(false),
    isPrivate: integer("is_private", { mode: "boolean" }).default(false),
    isArchived: integer("is_archived", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("discord_channel_server_id_index").on(t.serverId),
    index("discord_channel_channel_id_index").on(t.channelId),
    index("discord_channel_guild_id_index").on(t.guildId),
    index("discord_channel_type_index").on(t.type),
  ],
);

export const DiscordChannel = createSelectSchema(discordChannel, {
  channelId: z.string().trim().min(1),
  guildId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.number().int(),
});
export type DiscordChannel = z.output<typeof DiscordChannel>;
export const DiscordChannelInsert = createInsertSchema(discordChannel, {
  channelId: z.string().trim().min(1),
  guildId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.number().int(),
});
export type DiscordChannelInsert = z.output<typeof DiscordChannelInsert>;
export const DiscordChannelUpdate = createUpdateSchema(discordChannel, {
  channelId: z.string().trim().min(1),
  guildId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  type: z.number().int(),
});
export type DiscordChannelUpdate = z.output<typeof DiscordChannelUpdate>;
