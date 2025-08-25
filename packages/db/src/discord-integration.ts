import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const discordIntegration = sqliteTable(
  "discord_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    guildId: text("guild_id").notNull().unique(), // Discord server ID
    guildName: text("guild_name"),
    botAccessToken: text("bot_access_token").notNull(), // Bot token
    botScopes: text("bot_scopes"), // Comma-separated bot scopes
    botPermissions: text("bot_permissions"), // Comma-separated permissions
    botUserId: text("bot_user_id"), // Bot user ID in the guild
    applicationId: text("application_id"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    refreshToken: text("refresh_token"),
    gatewayDurableObjectId: text("gateway_durable_object_id"), // Durable Object ID for Discord Gateway
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    syncId: text("sync_id"),
    syncUpdatedAt: integer("sync_updated_at", { mode: "timestamp" }),
    syncStartedAt: integer("sync_started_at", { mode: "timestamp" }),
    syncFinishedAt: integer("sync_finished_at", { mode: "timestamp" }),
    syncError: text("sync_error"),
    syncErrorAt: integer("sync_error_at", { mode: "timestamp" }),
    deleteId: text("delete_id"),
    deleteError: text("delete_error"),
  },
  (t) => [
    index("discord_organization_id_index").on(t.organizationId),
    index("discord_sync_id_index").on(t.syncId),
    index("discord_delete_id_index").on(t.deleteId),
    index("discord_guild_id_index").on(t.guildId),
    index("discord_gateway_do_id_index").on(t.gatewayDurableObjectId),
  ],
);

export const DiscordIntegration = createSelectSchema(discordIntegration);
export type DiscordIntegration = z.output<typeof DiscordIntegration>;
export const DiscordIntegrationInsert = createInsertSchema(discordIntegration);
export type DiscordIntegrationInsert = z.output<typeof DiscordIntegrationInsert>;
export const DiscordIntegrationUpdate = createUpdateSchema(discordIntegration);
export type DiscordIntegrationUpdate = z.output<typeof DiscordIntegrationUpdate>;
