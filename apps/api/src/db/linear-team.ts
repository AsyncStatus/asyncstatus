import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { linearIntegration } from "./linear-integration";

export const linearTeam = sqliteTable(
  "linear_team",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => linearIntegration.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull(),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    private: integer("private", { mode: "boolean" }),
    icon: text("icon"),
    color: text("color"),
    timezone: text("timezone"),
    issueCount: integer("issue_count"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("linear_team_integration_id_index").on(t.integrationId),
    index("linear_team_team_id_index").on(t.teamId),
  ],
);

export const LinearTeam = createSelectSchema(linearTeam, {
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  key: z.string().trim().min(1),
});
export type LinearTeam = z.output<typeof LinearTeam>;
export const LinearTeamInsert = createInsertSchema(linearTeam, {
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  key: z.string().trim().min(1),
});
export type LinearTeamInsert = z.output<typeof LinearTeamInsert>;
export const LinearTeamUpdate = createUpdateSchema(linearTeam, {
  teamId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  key: z.string().trim().min(1),
});
export type LinearTeamUpdate = z.output<typeof LinearTeamUpdate>;