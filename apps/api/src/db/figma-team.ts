import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { figmaIntegration } from "./figma-integration";

export const figmaTeam = sqliteTable(
  "figma_team",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => figmaIntegration.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    plan: text("plan"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("figma_team_integration_id_index").on(t.integrationId),
    index("figma_team_team_id_index").on(t.teamId),
  ],
);

export const FigmaTeam = createSelectSchema(figmaTeam, {
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type FigmaTeam = z.output<typeof FigmaTeam>;
export const FigmaTeamInsert = createInsertSchema(figmaTeam, {
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type FigmaTeamInsert = z.output<typeof FigmaTeamInsert>;
export const FigmaTeamUpdate = createUpdateSchema(figmaTeam, {
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
});
export type FigmaTeamUpdate = z.output<typeof FigmaTeamUpdate>;