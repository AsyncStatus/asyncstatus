import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const gitlabIntegration = sqliteTable(
  "gitlab_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    gitlabInstanceUrl: text("gitlab_instance_url").notNull().default("https://gitlab.com"),
    groupId: text("group_id"), // GitLab group/namespace ID if connected to a group
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
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
    index("gitlab_organization_id_index").on(t.organizationId),
    index("gitlab_sync_id_index").on(t.syncId),
    index("gitlab_instance_url_index").on(t.gitlabInstanceUrl),
  ],
);

export const GitlabIntegration = createSelectSchema(gitlabIntegration, {
  gitlabInstanceUrl: z.string().url().default("https://gitlab.com"),
});
export type GitlabIntegration = z.output<typeof GitlabIntegration>;
export const GitlabIntegrationInsert = createInsertSchema(gitlabIntegration, {
  gitlabInstanceUrl: z.string().url().default("https://gitlab.com"),
});
export type GitlabIntegrationInsert = z.output<typeof GitlabIntegrationInsert>;
export const GitlabIntegrationUpdate = createUpdateSchema(gitlabIntegration, {
  gitlabInstanceUrl: z.string().url().optional(),
});
export type GitlabIntegrationUpdate = z.output<typeof GitlabIntegrationUpdate>;
