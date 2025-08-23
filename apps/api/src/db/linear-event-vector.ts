import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema, float32Array } from "./common";
import { linearEvent } from "./linear-event";

export const linearEventVector = sqliteTable(
  "linear_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => linearEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(),
    embedding: float32Array("embedding", { dimensions: 1024 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("linear_event_vector_event_id_index").on(t.eventId)],
);

export const LinearEventVector = createSelectSchema(linearEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type LinearEventVector = z.output<typeof LinearEventVector>;
export const LinearEventVectorInsert = createInsertSchema(linearEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type LinearEventVectorInsert = z.output<typeof LinearEventVectorInsert>;
export const LinearEventVectorUpdate = createUpdateSchema(linearEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type LinearEventVectorUpdate = z.output<typeof LinearEventVectorUpdate>;
