import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { linearIntegration } from "./linear-integration";

export const linearIssue = sqliteTable(
  "linear_issue",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => linearIntegration.id, { onDelete: "cascade" }),
    issueId: text("issue_id").notNull().unique(),
    teamId: text("team_id"),
    projectId: text("project_id"),
    cycleId: text("cycle_id"),
    parentId: text("parent_id"),
    number: integer("number").notNull(),
    identifier: text("identifier").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    priority: integer("priority"),
    priorityLabel: text("priority_label"),
    estimate: real("estimate"),
    sortOrder: real("sort_order"),
    state: text("state"),
    stateType: text("state_type"),
    assigneeId: text("assignee_id"),
    creatorId: text("creator_id"),
    labelIds: text("label_ids"),
    subscriberIds: text("subscriber_ids"),
    url: text("url"),
    branchName: text("branch_name"),
    customerTicketCount: integer("customer_ticket_count"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    canceledAt: integer("canceled_at", { mode: "timestamp" }),
    autoClosedAt: integer("auto_closed_at", { mode: "timestamp" }),
    autoArchivedAt: integer("auto_archived_at", { mode: "timestamp" }),
    snoozedUntilAt: integer("snoozed_until_at", { mode: "timestamp" }),
    startedAt: integer("started_at", { mode: "timestamp" }),
    triagedAt: integer("triaged_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("linear_issue_integration_id_index").on(t.integrationId),
    index("linear_issue_issue_id_index").on(t.issueId),
    index("linear_issue_team_id_index").on(t.teamId),
    index("linear_issue_project_id_index").on(t.projectId),
    index("linear_issue_assignee_id_index").on(t.assigneeId),
    index("linear_issue_identifier_index").on(t.identifier),
  ],
);

export const LinearIssue = createSelectSchema(linearIssue, {
  issueId: z.string().trim().min(1),
  identifier: z.string().trim().min(1),
  title: z.string().trim().min(1),
});
export type LinearIssue = z.output<typeof LinearIssue>;
export const LinearIssueInsert = createInsertSchema(linearIssue, {
  issueId: z.string().trim().min(1),
  identifier: z.string().trim().min(1),
  title: z.string().trim().min(1),
});
export type LinearIssueInsert = z.output<typeof LinearIssueInsert>;
export const LinearIssueUpdate = createUpdateSchema(linearIssue, {
  issueId: z.string().trim().min(1),
  identifier: z.string().trim().min(1),
  title: z.string().trim().min(1),
});
export type LinearIssueUpdate = z.output<typeof LinearIssueUpdate>;
