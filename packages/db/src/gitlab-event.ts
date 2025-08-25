import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import type { AnyGitlabWebhookEventDefinition } from "../lib/gitlab-event-definition";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { gitlabProject } from "./gitlab-project";

export const gitlabEvent = sqliteTable(
  "gitlab_event",
  {
    id: text("id").primaryKey(),
    gitlabId: text("gitlab_id").notNull().unique(), // Generated event ID (GitLab doesn't provide one)
    gitlabActorId: text("gitlab_actor_id").notNull(),
    projectId: text("project_id")
      .notNull()
      .references(() => gitlabProject.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    action: text("action"), // opened, closed, merged, etc.
    payload: text("payload", {
      mode: "json",
    }).$type<AnyGitlabWebhookEventDefinition>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    insertedAt: integer("inserted_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("gitlab_event_project_id_idx").on(t.projectId),
    index("gitlab_event_created_at_idx").on(t.createdAt),
    index("gitlab_event_gitlab_id_idx").on(t.gitlabId),
    index("gitlab_event_gitlab_actor_id_idx").on(t.gitlabActorId),
    index("gitlab_event_type_idx").on(t.type),
  ],
);

export const GitlabEvent = createSelectSchema(gitlabEvent, {
  gitlabId: z.string().trim().min(1),
  gitlabActorId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type GitlabEvent = z.output<typeof GitlabEvent>;
export const GitlabEventInsert = createInsertSchema(gitlabEvent, {
  gitlabId: z.string().trim().min(1),
  gitlabActorId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type GitlabEventInsert = z.output<typeof GitlabEventInsert>;
export const GitlabEventUpdate = createUpdateSchema(gitlabEvent, {
  gitlabId: z.string().trim().min(1).optional(),
  gitlabActorId: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
});
export type GitlabEventUpdate = z.output<typeof GitlabEventUpdate>;
