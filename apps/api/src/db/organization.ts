import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const organization = sqliteTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    logo: text("logo"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata"),
  },
  (t) => [index("slug_index").on(t.slug)],
);

export const Organization = createSelectSchema(organization, {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});
export const OrganizationInsert = createInsertSchema(organization, {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});
export const OrganizationUpdate = createUpdateSchema(organization, {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});
