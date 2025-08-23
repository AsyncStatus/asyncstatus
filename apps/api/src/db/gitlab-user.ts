import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { gitlabIntegration } from "./gitlab-integration";

export const gitlabUser = sqliteTable(
  "gitlab_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => gitlabIntegration.id, { onDelete: "cascade" }),
    gitlabId: text("gitlab_id").notNull().unique(),
    username: text("username").notNull(),
    name: text("name"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    webUrl: text("web_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("gitlab_user_integration_id_index").on(t.integrationId),
    index("gitlab_user_gitlab_id_index").on(t.gitlabId),
  ],
);

export const GitlabUser = createSelectSchema(gitlabUser, {
  gitlabId: z.string().trim().min(1),
  username: z.string().trim().min(1),
  webUrl: z.string().url(),
});
export type GitlabUser = z.output<typeof GitlabUser>;
export const GitlabUserInsert = createInsertSchema(gitlabUser, {
  gitlabId: z.string().trim().min(1),
  username: z.string().trim().min(1),
  webUrl: z.string().url(),
});
export type GitlabUserInsert = z.output<typeof GitlabUserInsert>;
export const GitlabUserUpdate = createUpdateSchema(gitlabUser, {
  gitlabId: z.string().trim().min(1).optional(),
  username: z.string().trim().min(1).optional(),
  webUrl: z.string().url().optional(),
});
export type GitlabUserUpdate = z.output<typeof GitlabUserUpdate>;
