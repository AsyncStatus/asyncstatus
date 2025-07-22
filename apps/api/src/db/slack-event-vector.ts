import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema, float32Array } from "./common";
import { slackEvent } from "./slack-event";

export const slackEventVector = sqliteTable(
  "slack_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => slackEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(), // Summary of the Slack event
    embedding: float32Array("embedding", { dimensions: 1024 }).notNull(), // Vector embedding
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("slack_event_vector_event_id_idx").on(t.eventId)],
);

export const SlackEventVector = createSelectSchema(slackEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type SlackEventVector = z.output<typeof SlackEventVector>;
export const SlackEventVectorInsert = createInsertSchema(slackEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type SlackEventVectorInsert = z.output<typeof SlackEventVectorInsert>;
export const SlackEventVectorUpdate = createUpdateSchema(slackEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type SlackEventVectorUpdate = z.output<typeof SlackEventVectorUpdate>;
