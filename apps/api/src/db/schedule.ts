import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { member } from "./member";
import { organization } from "./organization";
import { ScheduleConfig, ScheduleName } from "./schedule-config-schema";

export const schedule = sqliteTable(
  "schedule",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdByMemberId: text("created_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull().$type<ScheduleName>(),
    config: text("config", { mode: "json" }).notNull().$type<ScheduleConfig>(),

    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("schedule_organization_id_index").on(t.organizationId),
    index("schedule_created_by_member_id_index").on(t.createdByMemberId),
    index("schedule_active_index").on(t.isActive),
    index("schedule_name_index").on(t.name),
  ],
);

export const Schedule = createSelectSchema(schedule, {
  name: ScheduleName,
  config: ScheduleConfig,
});
export type Schedule = z.output<typeof Schedule>;
export const ScheduleInsert = createInsertSchema(schedule, {
  name: ScheduleName,
  config: ScheduleConfig,
});
export type ScheduleInsert = z.output<typeof ScheduleInsert>;
export const ScheduleUpdate = createUpdateSchema(schedule, {
  name: ScheduleName,
  config: ScheduleConfig,
});
export type ScheduleUpdate = z.output<typeof ScheduleUpdate>;
