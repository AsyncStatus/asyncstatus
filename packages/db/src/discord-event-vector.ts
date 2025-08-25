import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema, float32Array } from "./common";
import { discordEvent } from "./discord-event";

export const discordEventVector = sqliteTable(
  "discord_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => discordEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(), // Summary of the Discord event
    embedding: float32Array("embedding", { dimensions: 1024 }).notNull(), // Vector embedding
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("discord_event_vector_event_id_idx").on(t.eventId)],
);

export const DiscordEventVector = createSelectSchema(discordEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type DiscordEventVector = z.output<typeof DiscordEventVector>;
export const DiscordEventVectorInsert = createInsertSchema(discordEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type DiscordEventVectorInsert = z.output<typeof DiscordEventVectorInsert>;
export const DiscordEventVectorUpdate = createUpdateSchema(discordEventVector, {
  embeddingText: z.string().trim().min(1),
  embedding: z.array(z.number()),
});
export type DiscordEventVectorUpdate = z.output<typeof DiscordEventVectorUpdate>;
