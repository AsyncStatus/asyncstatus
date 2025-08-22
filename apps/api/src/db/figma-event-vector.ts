import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm/sql";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { figmaEvent } from "./figma-event";

export const figmaEventVector = sqliteTable(
  "figma_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .unique()
      .references(() => figmaEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(),
    embedding: text("embedding", { mode: "json" })
      .notNull()
      .default(sql`'[]'`),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("figma_event_vector_event_id_index").on(t.eventId),
    index("figma_event_vector_created_at_index").on(t.createdAt),
  ],
);

export const FigmaEventVector = createSelectSchema(figmaEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type FigmaEventVector = z.output<typeof FigmaEventVector>;
export const FigmaEventVectorInsert = createInsertSchema(figmaEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type FigmaEventVectorInsert = z.output<typeof FigmaEventVectorInsert>;
export const FigmaEventVectorUpdate = createUpdateSchema(figmaEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type FigmaEventVectorUpdate = z.output<typeof FigmaEventVectorUpdate>;