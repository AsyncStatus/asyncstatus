import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema, float32Array } from "./common";
import { githubEvent } from "./github-event";

export const githubEventVector = sqliteTable(
  "github_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => githubEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(),
    embedding: float32Array("embedding", { dimensions: 1024 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("github_event_vector_event_id_idx").on(t.eventId)],
);

export const GithubEventVector = createSelectSchema(githubEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type GithubEventVector = z.output<typeof GithubEventVector>;
export const GithubEventVectorInsert = createInsertSchema(githubEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type GithubEventVectorInsert = z.output<typeof GithubEventVectorInsert>;
export const GithubEventVectorUpdate = createUpdateSchema(githubEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type GithubEventVectorUpdate = z.output<typeof GithubEventVectorUpdate>;
