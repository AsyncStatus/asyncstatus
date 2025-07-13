import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { githubIntegration } from "./github-integration";

export const githubUser = sqliteTable(
  "github_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => githubIntegration.id, { onDelete: "cascade" }),
    githubId: text("github_id").notNull().unique(),
    login: text("login").notNull(),
    avatarUrl: text("avatar_url"),
    htmlUrl: text("html_url").notNull(),
    name: text("name"),
    email: text("email"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("github_user_integration_id_index").on(t.integrationId),
    index("github_user_github_id_index").on(t.githubId),
  ],
);

export const GithubUser = createSelectSchema(githubUser, {
  githubId: z.string().trim().min(1),
  login: z.string().trim().min(1),
});
export type GithubUser = z.output<typeof GithubUser>;
export const GithubUserInsert = createInsertSchema(githubUser, {
  githubId: z.string().trim().min(1),
  login: z.string().trim().min(1),
});
export type GithubUserInsert = z.output<typeof GithubUserInsert>;
export const GithubUserUpdate = createUpdateSchema(githubUser, {
  githubId: z.string().trim().min(1),
  login: z.string().trim().min(1),
});
export type GithubUserUpdate = z.output<typeof GithubUserUpdate>;
