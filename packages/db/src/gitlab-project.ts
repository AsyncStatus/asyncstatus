import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { gitlabIntegration } from "./gitlab-integration";

export const gitlabProject = sqliteTable(
  "gitlab_project",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => gitlabIntegration.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull().unique(),
    name: text("name").notNull(),
    namespace: text("namespace").notNull(),
    pathWithNamespace: text("path_with_namespace").notNull(),
    visibility: text("visibility").notNull(), // private, internal, public
    webUrl: text("web_url").notNull(),
    description: text("description"),
    defaultBranch: text("default_branch"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("gitlab_project_integration_id_index").on(t.integrationId),
    index("gitlab_project_project_id_index").on(t.projectId),
  ],
);

export const GitlabProject = createSelectSchema(gitlabProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  namespace: z.string().trim().min(1),
  pathWithNamespace: z.string().trim().min(1),
  webUrl: z.string().url(),
});
export type GitlabProject = z.output<typeof GitlabProject>;
export const GitlabProjectInsert = createInsertSchema(gitlabProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  namespace: z.string().trim().min(1),
  pathWithNamespace: z.string().trim().min(1),
  webUrl: z.string().url(),
});
export type GitlabProjectInsert = z.output<typeof GitlabProjectInsert>;
export const GitlabProjectUpdate = createUpdateSchema(gitlabProject, {
  projectId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  namespace: z.string().trim().min(1).optional(),
  pathWithNamespace: z.string().trim().min(1).optional(),
  webUrl: z.string().url().optional(),
});
export type GitlabProjectUpdate = z.output<typeof GitlabProjectUpdate>;
