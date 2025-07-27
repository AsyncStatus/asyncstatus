import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { ScheduleDelivery, ScheduleDeliveryInsert } from "../db";

export const getScheduleDeliveryContract = typedContract(
  "get /organizations/:idOrSlug/schedules/:scheduleId/deliveries/:deliveryId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    deliveryId: z.string(),
  }),
  ScheduleDelivery,
);

export const upsertScheduleDeliveryContract = typedContract(
  "post /organizations/:idOrSlug/schedules/:scheduleId/deliveries",
  z.strictObject({
    id: ScheduleDeliveryInsert.shape.id.optional(),
    idOrSlug: z.string(),
    scheduleId: z.string(),
    deliveryMethod: ScheduleDeliveryInsert.shape.deliveryMethod,
  }),
  ScheduleDelivery,
);

export const deleteScheduleDeliveryContract = typedContract(
  "delete /organizations/:idOrSlug/schedules/:scheduleId/deliveries/:deliveryId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    deliveryId: z.string(),
  }),
  z.strictObject({ success: z.boolean() }),
);
