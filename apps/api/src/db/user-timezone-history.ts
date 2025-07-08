import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { user } from "./user";

export const userTimezoneHistory = sqliteTable(
  "user_timezone_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    timezone: text("timezone").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("user_timezone_history_user_id_index").on(t.userId),
    index("user_timezone_history_created_at_index").on(t.createdAt),
  ],
);

export const UserTimezoneHistory = createSelectSchema(userTimezoneHistory, {
  timezone: z.string().trim().min(1),
});
export type UserTimezoneHistory = z.output<typeof UserTimezoneHistory>;
export const UserTimezoneHistoryInsert = createInsertSchema(userTimezoneHistory, {
  timezone: z.string().trim().min(1),
});
export type UserTimezoneHistoryInsert = z.output<typeof UserTimezoneHistoryInsert>;
export const UserTimezoneHistoryUpdate = createUpdateSchema(userTimezoneHistory, {
  timezone: z.string().trim().min(1),
});
export type UserTimezoneHistoryUpdate = z.output<typeof UserTimezoneHistoryUpdate>;
