import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { linearEvent } from "./linear-event";

export const linearEventVector = sqliteTable(
  "linear_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => linearEvent.id, { onDelete: "cascade" }),
    embedding: text("embedding", { mode: "json" }).notNull(),
    content: text("content").notNull(),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("linear_event_vector_event_id_index").on(t.eventId),
  ],
);

export const LinearEventVector = createSelectSchema(linearEventVector, {
  eventId: z.string().trim().min(1),
  embedding: z.any(),
  content: z.string().trim().min(1),
});
export type LinearEventVector = z.output<typeof LinearEventVector>;
export const LinearEventVectorInsert = createInsertSchema(linearEventVector, {
  eventId: z.string().trim().min(1),
  embedding: z.any(),
  content: z.string().trim().min(1),
});
export type LinearEventVectorInsert = z.output<typeof LinearEventVectorInsert>;
export const LinearEventVectorUpdate = createUpdateSchema(linearEventVector, {
  eventId: z.string().trim().min(1),
  embedding: z.any(),
  content: z.string().trim().min(1),
});
export type LinearEventVectorUpdate = z.output<typeof LinearEventVectorUpdate>;