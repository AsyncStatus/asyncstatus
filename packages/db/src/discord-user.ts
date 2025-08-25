import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { discordIntegration } from "./discord-integration";

export const discordUser = sqliteTable(
  "discord_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => discordIntegration.id, { onDelete: "cascade" }),
    discordUserId: text("discord_user_id").notNull().unique(), // Discord user ID
    username: text("username").notNull(), // Username without discriminator
    discriminator: text("discriminator"), // 4-digit discriminator (null for new usernames)
    globalName: text("global_name"), // Display name
    email: text("email"),
    avatarHash: text("avatar_hash"),
    isBot: integer("is_bot", { mode: "boolean" }).default(false),
    isSystem: integer("is_system", { mode: "boolean" }).default(false),
    locale: text("locale"),
    verified: integer("verified", { mode: "boolean" }).default(false),
    mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).default(false),
    premiumType: integer("premium_type"), // Nitro subscription type
    accessToken: text("access_token"), // User OAuth2 token (if user authorized)
    scopes: text("scopes"), // Comma-separated OAuth2 scopes
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    refreshToken: text("refresh_token"),
    isInstaller: integer("is_installer", { mode: "boolean" }).default(false), // True for the user who added the bot
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("discord_user_integration_id_index").on(t.integrationId),
    index("discord_user_discord_user_id_index").on(t.discordUserId),
    index("discord_user_username_index").on(t.username),
  ],
);

export const DiscordUser = createSelectSchema(discordUser, {
  discordUserId: z.string().trim().min(1),
  username: z.string().trim().min(1),
});
export type DiscordUser = z.output<typeof DiscordUser>;
export const DiscordUserInsert = createInsertSchema(discordUser, {
  discordUserId: z.string().trim().min(1),
  username: z.string().trim().min(1),
});
export type DiscordUserInsert = z.output<typeof DiscordUserInsert>;
export const DiscordUserUpdate = createUpdateSchema(discordUser, {
  discordUserId: z.string().trim().min(1),
  username: z.string().trim().min(1),
});
export type DiscordUserUpdate = z.output<typeof DiscordUserUpdate>;
