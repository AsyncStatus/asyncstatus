import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const slackIntegration = sqliteTable(
  "slack_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull().unique(),
    teamName: text("team_name"),
    enterpriseId: text("enterprise_id"), // From enterprise.id (if Enterprise Grid)
    enterpriseName: text("enterprise_name"), // From enterprise.name
    botAccessToken: text("bot_access_token").notNull(), // Main bot token (xoxb-)
    botScopes: text("bot_scopes"), // Comma-separated bot scopes
    botUserId: text("bot_user_id"), // Bot user ID in the workspace
    appId: text("app_id"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    refreshToken: text("refresh_token"),
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
    index("slack_organization_id_index").on(t.organizationId),
    index("slack_sync_id_index").on(t.syncId),
    index("slack_delete_id_index").on(t.deleteId),
  ],
);

export const SlackIntegration = createSelectSchema(slackIntegration, {
  teamId: z.string().trim().min(1),
});
export type SlackIntegration = z.output<typeof SlackIntegration>;
export const SlackIntegrationInsert = createInsertSchema(slackIntegration, {
  teamId: z.string().trim().min(1),
});
export type SlackIntegrationInsert = z.output<typeof SlackIntegrationInsert>;
export const SlackIntegrationUpdate = createUpdateSchema(slackIntegration, {
  teamId: z.string().trim().min(1),
});
export type SlackIntegrationUpdate = z.output<typeof SlackIntegrationUpdate>;
