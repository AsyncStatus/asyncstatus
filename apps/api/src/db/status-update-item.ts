import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { statusUpdate } from "./status-update";

export const statusUpdateItem = sqliteTable(
  "status_update_item",
  {
    id: text("id").primaryKey(),
    statusUpdateId: text("status_update_id")
      .notNull()
      .references(() => statusUpdate.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isBlocker: integer("is_blocker", { mode: "boolean" }).notNull().default(false),
    isInProgress: integer("is_in_progress", { mode: "boolean" }).notNull().default(false),
    order: integer("order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [
    index("status_update_item_update_id_index").on(t.statusUpdateId),
    index("status_update_item_blocker_index").on(t.isBlocker),
  ],
);

export const StatusUpdateItem = createSelectSchema(statusUpdateItem, {
  content: z.string().trim().min(1),
  isBlocker: z.boolean(),
  isInProgress: z.boolean(),
  order: z.number(),
});
export type StatusUpdateItem = z.output<typeof StatusUpdateItem>;
export const StatusUpdateItemInsert = createInsertSchema(statusUpdateItem, {
  content: z.string().trim().min(1),
  isBlocker: z.boolean(),
  isInProgress: z.boolean(),
  order: z.number(),
});
export type StatusUpdateItemInsert = z.output<typeof StatusUpdateItemInsert>;
export const StatusUpdateItemUpdate = createUpdateSchema(statusUpdateItem, {
  content: z.string().trim().min(1),
  isBlocker: z.boolean(),
  isInProgress: z.boolean(),
  order: z.number(),
});
export type StatusUpdateItemUpdate = z.output<typeof StatusUpdateItemUpdate>;
