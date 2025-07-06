import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { organization } from "./organization";

export const team = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const Team = createSelectSchema(team, {
  name: z.string().trim().min(1),
});
export const TeamInsert = createInsertSchema(team, {
  name: z.string().trim().min(1),
});
export const TeamUpdate = createUpdateSchema(team, {
  name: z.string().trim().min(1),
});
