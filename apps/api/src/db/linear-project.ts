import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { linearIntegration } from "./linear-integration";

export const linearProject = sqliteTable(
  "linear_project",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => linearIntegration.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull().unique(),
    teamId: text("team_id"),
    name: text("name").notNull(),
    key: text("key"),
    description: text("description"),
    state: text("state"),
    startDate: integer("start_date", { mode: "timestamp" }),
    targetDate: integer("target_date", { mode: "timestamp" }),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    color: text("color"),
    icon: text("icon"),
    progress: text("progress"),
    issueCount: integer("issue_count"),
    completedIssueCount: integer("completed_issue_count"),
    scopeChangeCount: integer("scope_change_count"),
    completedScopeChangeCount: integer("completed_scope_change_count"),
    slackNewIssue: integer("slack_new_issue", { mode: "boolean" }),
    slackIssueComments: integer("slack_issue_comments", { mode: "boolean" }),
    slackIssueStatuses: integer("slack_issue_statuses", { mode: "boolean" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("linear_project_integration_id_index").on(t.integrationId),
    index("linear_project_project_id_index").on(t.projectId),
    index("linear_project_team_id_index").on(t.teamId),
  ],
);

export const LinearProject = createSelectSchema(linearProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type LinearProject = z.output<typeof LinearProject>;
export const LinearProjectInsert = createInsertSchema(linearProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type LinearProjectInsert = z.output<typeof LinearProjectInsert>;
export const LinearProjectUpdate = createUpdateSchema(linearProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type LinearProjectUpdate = z.output<typeof LinearProjectUpdate>;
