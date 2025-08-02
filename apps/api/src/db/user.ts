import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    image: text("image"),
    autoDetectTimezone: integer("auto_detect_timezone", { mode: "boolean" })
      .notNull()
      .default(true),
    timezone: text("timezone").notNull().default("UTC"),
    activeOrganizationSlug: text("active_organization_slug"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("email_user_index").on(t.email)],
);

export const User = createSelectSchema(user, {
  name: z.string().trim().min(1),
  email: z.email(),
});
export type User = z.output<typeof User>;
export const UserInsert = createInsertSchema(user, {
  name: z.string().trim().min(1),
  email: z.email(),
});
export type UserInsert = z.output<typeof UserInsert>;
export const UserUpdate = createUpdateSchema(user, {
  name: z.string().trim().min(1),
  email: z.email(),
});
export type UserUpdate = z.output<typeof UserUpdate>;
