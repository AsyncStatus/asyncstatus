import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { figmaIntegration } from "./figma-integration";

export const figmaUser = sqliteTable(
  "figma_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => figmaIntegration.id, { onDelete: "cascade" }),
    figmaId: text("figma_id").notNull().unique(),
    email: text("email"),
    handle: text("handle").notNull(),
    imgUrl: text("img_url"),
    name: text("name"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("figma_user_integration_id_index").on(t.integrationId),
    index("figma_user_figma_id_index").on(t.figmaId),
    index("figma_user_email_index").on(t.email),
  ],
);

export const FigmaUser = createSelectSchema(figmaUser, {
  figmaId: z.string().trim().min(1),
  handle: z.string().trim().min(1),
  email: z.string().email().optional(),
});
export type FigmaUser = z.output<typeof FigmaUser>;
export const FigmaUserInsert = createInsertSchema(figmaUser, {
  figmaId: z.string().trim().min(1),
  handle: z.string().trim().min(1),
  email: z.string().email().optional(),
});
export type FigmaUserInsert = z.output<typeof FigmaUserInsert>;
export const FigmaUserUpdate = createUpdateSchema(figmaUser, {
  figmaId: z.string().trim().min(1),
  handle: z.string().trim().min(1),
  email: z.string().email().optional(),
});
export type FigmaUserUpdate = z.output<typeof FigmaUserUpdate>;