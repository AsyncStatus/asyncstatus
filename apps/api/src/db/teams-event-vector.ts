import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { teamsEvent } from "./teams-event";

export const teamsEventVector = sqliteTable(
  "teams_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .unique()
      .references(() => teamsEvent.id, { onDelete: "cascade" }),
    vector: text("vector").notNull(), // JSON array of floats
  },
  (t) => [index("teams_event_vector_event_id_index").on(t.eventId)],
);

export const TeamsEventVector = createSelectSchema(teamsEventVector);
export type TeamsEventVector = z.output<typeof TeamsEventVector>;
export const TeamsEventVectorInsert = createInsertSchema(teamsEventVector);
export type TeamsEventVectorInsert = z.output<typeof TeamsEventVectorInsert>;
export const TeamsEventVectorUpdate = createUpdateSchema(teamsEventVector);
export type TeamsEventVectorUpdate = z.output<typeof TeamsEventVectorUpdate>;