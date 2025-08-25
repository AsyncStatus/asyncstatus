import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import type {
  AnyGithubWebhookEventDefinition,
  GithubWebhookEventName,
} from "../lib/github-event-definition";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { githubRepository } from "./github-repository";

export const githubEvent = sqliteTable(
  "github_event",
  {
    id: text("id").primaryKey(),
    githubId: text("github_id").notNull().unique(), // GitHub event ID (snowflake)
    githubActorId: text("github_actor_id").notNull(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => githubRepository.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<GithubWebhookEventName>(),
    payload: text("payload", {
      mode: "json",
    }).$type<AnyGithubWebhookEventDefinition>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    insertedAt: integer("inserted_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("github_event_repository_id_idx").on(t.repositoryId),
    index("github_event_created_at_idx").on(t.createdAt),
    index("github_event_github_id_idx").on(t.githubId),
    index("github_event_github_actor_id_idx").on(t.githubActorId),
    index("github_event_type_idx").on(t.type),
  ],
);

export const GithubEvent = createSelectSchema(githubEvent, {
  githubId: z.string().trim().min(1),
  githubActorId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type GithubEvent = z.output<typeof GithubEvent>;
export const GithubEventInsert = createInsertSchema(githubEvent, {
  githubId: z.string().trim().min(1),
  githubActorId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type GithubEventInsert = z.output<typeof GithubEventInsert>;
export const GithubEventUpdate = createUpdateSchema(githubEvent, {
  githubId: z.string().trim().min(1),
  githubActorId: z.string().trim().min(1),
  type: z.string().trim().min(1),
});
export type GithubEventUpdate = z.output<typeof GithubEventUpdate>;
