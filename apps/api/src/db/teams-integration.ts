import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const teamsIntegration = sqliteTable(
  "teams_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull().unique(), // Azure AD tenant ID
    teamId: text("team_id"), // Primary team ID (optional for multi-team tenants)
    teamName: text("team_name"),
    botAccessToken: text("bot_access_token").notNull(), // Bot Framework token
    botRefreshToken: text("bot_refresh_token"),
    graphAccessToken: text("graph_access_token"), // Microsoft Graph API token
    graphRefreshToken: text("graph_refresh_token"),
    botScopes: text("bot_scopes"), // Comma-separated bot scopes
    graphScopes: text("graph_scopes"), // Comma-separated Graph API scopes
    botUserId: text("bot_user_id"), // Bot user ID in Teams
    appId: text("app_id"), // Azure AD application ID
    appTenantId: text("app_tenant_id"), // App's Azure AD tenant ID
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    graphTokenExpiresAt: integer("graph_token_expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    syncId: text("sync_id"),
    syncUpdatedAt: integer("sync_updated_at", { mode: "timestamp" }),
    syncStartedAt: integer("sync_started_at", { mode: "timestamp" }),
    syncFinishedAt: integer("sync_finished_at", { mode: "timestamp" }),
    syncError: text("sync_error"),
    syncErrorAt: integer("sync_error_at", { mode: "timestamp" }),
    deltaLink: text("delta_link"), // For delta queries to get changes
    deleteId: text("delete_id"),
    deleteError: text("delete_error"),
  },
  (t) => [
    index("teams_organization_id_index").on(t.organizationId),
    index("teams_tenant_id_index").on(t.tenantId),
    index("teams_sync_id_index").on(t.syncId),
    index("teams_delete_id_index").on(t.deleteId),
  ],
);

export const TeamsIntegration = createSelectSchema(teamsIntegration, {
  tenantId: z.string().trim().min(1),
});
export type TeamsIntegration = z.output<typeof TeamsIntegration>;
export const TeamsIntegrationInsert = createInsertSchema(teamsIntegration, {
  tenantId: z.string().trim().min(1),
});
export type TeamsIntegrationInsert = z.output<typeof TeamsIntegrationInsert>;
export const TeamsIntegrationUpdate = createUpdateSchema(teamsIntegration, {
  tenantId: z.string().trim().min(1),
});
export type TeamsIntegrationUpdate = z.output<typeof TeamsIntegrationUpdate>;