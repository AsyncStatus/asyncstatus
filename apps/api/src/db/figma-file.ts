import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { figmaProject } from "./figma-project";

export const figmaFile = sqliteTable(
  "figma_file",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => figmaProject.id, { onDelete: "cascade" }),
    fileKey: text("file_key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    fileType: text("file_type").notNull(), // 'design' | 'figjam' | 'dev_mode'
    thumbnailUrl: text("thumbnail_url"),
    lastModified: integer("last_modified", { mode: "timestamp" }),
    editorType: text("editor_type"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("figma_file_project_id_index").on(t.projectId),
    index("figma_file_file_key_index").on(t.fileKey),
    index("figma_file_file_type_index").on(t.fileType),
  ],
);

export const FigmaFile = createSelectSchema(figmaFile, {
  fileKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
  fileType: z.enum(["design", "figjam", "dev_mode"]),
});
export type FigmaFile = z.output<typeof FigmaFile>;
export const FigmaFileInsert = createInsertSchema(figmaFile, {
  fileKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
  fileType: z.enum(["design", "figjam", "dev_mode"]),
});
export type FigmaFileInsert = z.output<typeof FigmaFileInsert>;
export const FigmaFileUpdate = createUpdateSchema(figmaFile, {
  fileKey: z.string().trim().min(1),
  name: z.string().trim().min(1),
  fileType: z.enum(["design", "figjam", "dev_mode"]),
});
export type FigmaFileUpdate = z.output<typeof FigmaFileUpdate>;