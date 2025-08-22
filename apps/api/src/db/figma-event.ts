import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { figmaFile } from "./figma-file";

export const figmaEvent = sqliteTable(
  "figma_event",
  {
    id: text("id").primaryKey(),
    figmaId: text("figma_id").notNull().unique(),
    figmaUserId: text("figma_user_id"),
    fileId: text("file_id").references(() => figmaFile.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // FILE_UPDATE, FILE_VERSION_UPDATE, COMMENT, etc.
    payload: text("payload", { mode: "json" }).notNull(),
    webhookId: text("webhook_id"),
    passcode: text("passcode"),
    timestamp: text("timestamp").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    insertedAt: integer("inserted_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("figma_event_file_id_index").on(t.fileId),
    index("figma_event_figma_user_id_index").on(t.figmaUserId),
    index("figma_event_type_index").on(t.type),
    index("figma_event_created_at_index").on(t.createdAt),
    index("figma_event_figma_id_index").on(t.figmaId),
  ],
);

export const FigmaEvent = createSelectSchema(figmaEvent, {
  figmaId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  payload: z.any(),
  timestamp: z.string().trim().min(1),
});
export type FigmaEvent = z.output<typeof FigmaEvent>;
export const FigmaEventInsert = createInsertSchema(figmaEvent, {
  figmaId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  payload: z.any(),
  timestamp: z.string().trim().min(1),
});
export type FigmaEventInsert = z.output<typeof FigmaEventInsert>;
export const FigmaEventUpdate = createUpdateSchema(figmaEvent, {
  figmaId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  payload: z.any(),
  timestamp: z.string().trim().min(1),
});
export type FigmaEventUpdate = z.output<typeof FigmaEventUpdate>;