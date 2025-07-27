import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { schedule } from "./schedule";

export const ScheduleDeliveryMethod = z.enum(["email", "slack"]);
export type ScheduleDeliveryMethod = z.infer<typeof ScheduleDeliveryMethod>;

export const scheduleDelivery = sqliteTable(
  "schedule_delivery",
  {
    id: text("id").primaryKey(),

    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    deliveryMethod: text("delivery_method").notNull().$type<ScheduleDeliveryMethod>(),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("schedule_delivery_schedule_id_index").on(t.scheduleId),
    index("schedule_delivery_method_index").on(t.deliveryMethod),
  ],
);

export const ScheduleDelivery = createSelectSchema(scheduleDelivery, {
  deliveryMethod: ScheduleDeliveryMethod,
});
export type ScheduleDelivery = z.output<typeof ScheduleDelivery>;
export const ScheduleDeliveryInsert = createInsertSchema(scheduleDelivery, {
  deliveryMethod: ScheduleDeliveryMethod,
});
export type ScheduleDeliveryInsert = z.output<typeof ScheduleDeliveryInsert>;
export const ScheduleDeliveryUpdate = createUpdateSchema(scheduleDelivery, {
  deliveryMethod: ScheduleDeliveryMethod,
});
export type ScheduleDeliveryUpdate = z.output<typeof ScheduleDeliveryUpdate>;
