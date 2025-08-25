import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema, float32Array } from "./common";
import { gitlabEvent } from "./gitlab-event";

export const gitlabEventVector = sqliteTable(
  "gitlab_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => gitlabEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(),
    embedding: float32Array("embedding", { dimensions: 1024 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("gitlab_event_vector_event_id_idx").on(t.eventId),
  ],
);

export const GitlabEventVector = createSelectSchema(gitlabEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type GitlabEventVector = z.output<typeof GitlabEventVector>;
export const GitlabEventVectorInsert = createInsertSchema(gitlabEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type GitlabEventVectorInsert = z.output<typeof GitlabEventVectorInsert>;
export const GitlabEventVectorUpdate = createUpdateSchema(gitlabEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type GitlabEventVectorUpdate = z.output<typeof GitlabEventVectorUpdate>;
