import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { githubIntegration } from "./github-integration";

export const githubRepository = sqliteTable(
  "github_repository",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => githubIntegration.id, { onDelete: "cascade" }),
    repoId: text("repo_id").notNull().unique(),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    fullName: text("full_name").notNull(),
    private: integer("private", { mode: "boolean" }).notNull(),
    htmlUrl: text("html_url").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("github_repo_integration_id_index").on(t.integrationId),
    index("github_repo_repo_id_index").on(t.repoId),
  ],
);

export const GithubRepository = createSelectSchema(githubRepository, {
  repoId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  owner: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
});
export const GithubRepositoryInsert = createInsertSchema(githubRepository, {
  repoId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  owner: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
});
export const GithubRepositoryUpdate = createUpdateSchema(githubRepository, {
  repoId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  owner: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
});
