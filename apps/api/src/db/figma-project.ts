import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { figmaTeam } from "./figma-team";

export const figmaProject = sqliteTable(
  "figma_project",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => figmaTeam.id, { onDelete: "cascade" }),
    projectId: text("project_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("figma_project_team_id_index").on(t.teamId),
    index("figma_project_project_id_index").on(t.projectId),
  ],
);

export const FigmaProject = createSelectSchema(figmaProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type FigmaProject = z.output<typeof FigmaProject>;
export const FigmaProjectInsert = createInsertSchema(figmaProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type FigmaProjectInsert = z.output<typeof FigmaProjectInsert>;
export const FigmaProjectUpdate = createUpdateSchema(figmaProject, {
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type FigmaProjectUpdate = z.output<typeof FigmaProjectUpdate>;