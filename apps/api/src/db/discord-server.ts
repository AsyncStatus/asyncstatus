import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { discordIntegration } from "./discord-integration";

export const discordServer = sqliteTable(
  "discord_server",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => discordIntegration.id, { onDelete: "cascade" }),
    guildId: text("guild_id").notNull().unique(), // Discord server ID
    name: text("name").notNull(),
    icon: text("icon"), // Icon hash
    description: text("description"),
    ownerId: text("owner_id"), // Discord user ID of the owner
    memberCount: integer("member_count"),
    premiumTier: integer("premium_tier"), // Server boost level
    preferredLocale: text("preferred_locale"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("discord_server_integration_id_index").on(t.integrationId),
    index("discord_server_guild_id_index").on(t.guildId),
  ],
);

export const DiscordServer = createSelectSchema(discordServer, {
  guildId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type DiscordServer = z.output<typeof DiscordServer>;
export const DiscordServerInsert = createInsertSchema(discordServer, {
  guildId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type DiscordServerInsert = z.output<typeof DiscordServerInsert>;
export const DiscordServerUpdate = createUpdateSchema(discordServer, {
  guildId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type DiscordServerUpdate = z.output<typeof DiscordServerUpdate>;
