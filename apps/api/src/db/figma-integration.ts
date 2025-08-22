import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const figmaIntegration = sqliteTable(
  "figma_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull(),
    teamName: text("team_name"),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    webhookSecret: text("webhook_secret"),
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
    index("figma_organization_id_index").on(t.organizationId),
    index("figma_sync_id_index").on(t.syncId),
    index("figma_team_id_index").on(t.teamId),
  ],
);

export const FigmaIntegration = createSelectSchema(figmaIntegration, {
  teamId: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});
export type FigmaIntegration = z.output<typeof FigmaIntegration>;
export const FigmaIntegrationInsert = createInsertSchema(figmaIntegration, {
  teamId: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});
export type FigmaIntegrationInsert = z.output<typeof FigmaIntegrationInsert>;
export const FigmaIntegrationUpdate = createUpdateSchema(figmaIntegration, {
  teamId: z.string().trim().min(1),
  accessToken: z.string().trim().min(1).optional(),
});
export type FigmaIntegrationUpdate = z.output<typeof FigmaIntegrationUpdate>;