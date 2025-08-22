import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { linearIntegration } from "./linear-integration";

export const linearUser = sqliteTable(
  "linear_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => linearIntegration.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    email: text("email"),
    name: text("name"),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    admin: integer("admin", { mode: "boolean" }),
    active: integer("active", { mode: "boolean" }),
    guest: integer("guest", { mode: "boolean" }),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("linear_user_integration_id_index").on(t.integrationId),
    index("linear_user_user_id_index").on(t.userId),
    index("linear_user_email_index").on(t.email),
  ],
);

export const LinearUser = createSelectSchema(linearUser, {
  userId: z.string().trim().min(1),
});
export type LinearUser = z.output<typeof LinearUser>;
export const LinearUserInsert = createInsertSchema(linearUser, {
  userId: z.string().trim().min(1),
});
export type LinearUserInsert = z.output<typeof LinearUserInsert>;
export const LinearUserUpdate = createUpdateSchema(linearUser, {
  userId: z.string().trim().min(1),
});
export type LinearUserUpdate = z.output<typeof LinearUserUpdate>;