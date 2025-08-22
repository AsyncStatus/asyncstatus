import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const linearIntegration = sqliteTable(
  "linear_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull().unique(),
    teamName: text("team_name"),
    teamKey: text("team_key"),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    userId: text("user_id"),
    userEmail: text("user_email"),
    scope: text("scope"),
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
    index("linear_organization_id_index").on(t.organizationId),
    index("linear_sync_id_index").on(t.syncId),
    index("linear_delete_id_index").on(t.deleteId),
  ],
);

export const LinearIntegration = createSelectSchema(linearIntegration, {
  teamId: z.string().trim().min(1),
});
export type LinearIntegration = z.output<typeof LinearIntegration>;
export const LinearIntegrationInsert = createInsertSchema(linearIntegration, {
  teamId: z.string().trim().min(1),
});
export type LinearIntegrationInsert = z.output<typeof LinearIntegrationInsert>;
export const LinearIntegrationUpdate = createUpdateSchema(linearIntegration, {
  teamId: z.string().trim().min(1),
});
export type LinearIntegrationUpdate = z.output<typeof LinearIntegrationUpdate>;