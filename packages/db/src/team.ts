import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { organization } from "./organization";

export const team = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdByMemberId: text("created_by_member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const Team = createSelectSchema(team, {
  name: z.string().trim().min(1),
  createdByMemberId: z.string().min(1),
});
export type Team = z.output<typeof Team>;
export const TeamInsert = createInsertSchema(team, {
  name: z.string().trim().min(1),
  createdByMemberId: z.string().min(1),
});
export type TeamInsert = z.output<typeof TeamInsert>;
export const TeamUpdate = createUpdateSchema(team, {
  name: z.string().trim().min(1),
  createdByMemberId: z.string().min(1),
});
export type TeamUpdate = z.output<typeof TeamUpdate>;
