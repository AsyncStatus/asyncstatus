import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { linearIntegration } from "./linear-integration";

export const linearEvent = sqliteTable(
  "linear_event",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => linearIntegration.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull().unique(),
    type: text("type").notNull(),
    action: text("action"),
    issueId: text("issue_id"),
    issueIdentifier: text("issue_identifier"),
    projectId: text("project_id"),
    userId: text("user_id"),
    teamId: text("team_id"),
    payload: text("payload", { mode: "json" }).notNull(),
    webhookId: text("webhook_id"),
    webhookTimestamp: integer("webhook_timestamp", { mode: "timestamp" }),
    processed: integer("processed", { mode: "boolean" }).default(false),
    processedAt: integer("processed_at", { mode: "timestamp" }),
    summary: text("summary"),
    summaryError: text("summary_error"),
    summaryCreatedAt: integer("summary_created_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("linear_event_integration_id_index").on(t.integrationId),
    index("linear_event_external_id_index").on(t.externalId),
    index("linear_event_issue_id_index").on(t.issueId),
    index("linear_event_user_id_index").on(t.userId),
    index("linear_event_processed_index").on(t.processed),
    index("linear_event_created_at_index").on(t.createdAt),
  ],
);

export const LinearEvent = createSelectSchema(linearEvent, {
  externalId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  payload: z.any(),
});
export type LinearEvent = z.output<typeof LinearEvent>;
export const LinearEventInsert = createInsertSchema(linearEvent, {
  externalId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  payload: z.any(),
});
export type LinearEventInsert = z.output<typeof LinearEventInsert>;
export const LinearEventUpdate = createUpdateSchema(linearEvent, {
  externalId: z.string().trim().min(1),
  type: z.string().trim().min(1),
  payload: z.any(),
});
export type LinearEventUpdate = z.output<typeof LinearEventUpdate>;
