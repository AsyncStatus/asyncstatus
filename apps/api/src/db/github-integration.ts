import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const githubIntegration = sqliteTable(
  "github_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    installationId: text("installation_id").notNull(),
    accessToken: text("access_token"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
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
    index("github_organization_id_index").on(t.organizationId),
    index("github_sync_id_index").on(t.syncId),
    index("github_installation_id_index").on(t.installationId),
  ],
);

export const GithubIntegration = createSelectSchema(githubIntegration, {
  installationId: z.string().trim().min(1),
});
export type GithubIntegration = z.output<typeof GithubIntegration>;
export const GithubIntegrationInsert = createInsertSchema(githubIntegration, {
  installationId: z.string().trim().min(1),
});
export type GithubIntegrationInsert = z.output<typeof GithubIntegrationInsert>;
export const GithubIntegrationUpdate = createUpdateSchema(githubIntegration, {
  installationId: z.string().trim().min(1),
});
export type GithubIntegrationUpdate = z.output<typeof GithubIntegrationUpdate>;
