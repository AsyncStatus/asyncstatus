import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import {
  Member,
  Schedule,
  ScheduleDelivery,
  ScheduleDeliveryTarget,
  ScheduleInsert,
  ScheduleTarget,
  ScheduleUpdate,
  User,
} from "../db";

export const listSchedulesContract = typedContract(
  "get /organizations/:idOrSlug/schedules",
  z.strictObject({ idOrSlug: z.string() }),
  z.array(
    z.strictObject({
      ...Schedule.shape,
      createdByMember: z.strictObject({ ...Member.shape, user: User }),
      targets: z.array(ScheduleTarget),
      deliveryTargets: z.array(ScheduleDeliveryTarget),
      deliveries: z.array(ScheduleDelivery),
    }),
  ),
);

export const getScheduleContract = typedContract(
  "get /organizations/:idOrSlug/schedules/:scheduleId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
  }),
  z.strictObject({
    ...Schedule.shape,
    createdByMember: z.strictObject({ ...Member.shape, user: User }),
    targets: z.array(ScheduleTarget),
    deliveryTargets: z.array(ScheduleDeliveryTarget),
    deliveries: z.array(ScheduleDelivery),
  }),
);

export const createScheduleContract = typedContract(
  "post /organizations/:idOrSlug/schedules",
  z
    .strictObject({
      idOrSlug: z.string(),
      actionType: ScheduleInsert.shape.actionType,
      recurrence: ScheduleInsert.shape.recurrence,
      timezone: ScheduleInsert.shape.timezone,
      dayOfWeek: ScheduleInsert.shape.dayOfWeek,
      dayOfMonth: ScheduleInsert.shape.dayOfMonth,
      timeOfDay: ScheduleInsert.shape.timeOfDay,
      isActive: ScheduleInsert.shape.isActive,
    })
    .refine(
      (data) => {
        if (
          data.recurrence === "weekly" &&
          (data.dayOfWeek === undefined || data.dayOfWeek === null)
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfWeek is required for weekly recurrence",
        path: ["dayOfWeek"],
      },
    )
    .refine(
      (data) => {
        if (
          data.recurrence === "monthly" &&
          (data.dayOfMonth === undefined || data.dayOfMonth === null)
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfMonth is required for monthly recurrence",
        path: ["dayOfMonth"],
      },
    )
    .refine(
      (data) => {
        if (
          data.recurrence !== "weekly" &&
          data.dayOfWeek !== undefined &&
          data.dayOfWeek !== null
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfWeek should only be set for weekly recurrence",
        path: ["dayOfWeek"],
      },
    )
    .refine(
      (data) => {
        if (
          data.recurrence !== "monthly" &&
          data.dayOfMonth !== undefined &&
          data.dayOfMonth !== null
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfMonth should only be set for monthly recurrence",
        path: ["dayOfMonth"],
      },
    ),
  z.strictObject({
    ...Schedule.shape,
    createdByMember: z.strictObject({ ...Member.shape, user: User }),
    targets: z.array(ScheduleTarget),
    deliveryTargets: z.array(ScheduleDeliveryTarget),
    deliveries: z.array(ScheduleDelivery),
  }),
);

export const updateScheduleContract = typedContract(
  "patch /organizations/:idOrSlug/schedules/:scheduleId",
  z
    .strictObject({
      idOrSlug: z.string(),
      scheduleId: z.string(),
      actionType: ScheduleUpdate.shape.actionType,
      recurrence: ScheduleUpdate.shape.recurrence,
      timezone: ScheduleUpdate.shape.timezone,
      dayOfWeek: ScheduleUpdate.shape.dayOfWeek,
      dayOfMonth: ScheduleUpdate.shape.dayOfMonth,
      timeOfDay: ScheduleUpdate.shape.timeOfDay,
      isActive: ScheduleUpdate.shape.isActive,
    })
    .refine(
      (data) => {
        // If recurrence is being set to weekly, dayOfWeek must be provided
        if (
          data.recurrence === "weekly" &&
          (data.dayOfWeek === undefined || data.dayOfWeek === null)
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfWeek is required when setting recurrence to weekly",
        path: ["dayOfWeek"],
      },
    )
    .refine(
      (data) => {
        // If recurrence is being set to monthly, dayOfMonth must be provided
        if (
          data.recurrence === "monthly" &&
          (data.dayOfMonth === undefined || data.dayOfMonth === null)
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfMonth is required when setting recurrence to monthly",
        path: ["dayOfMonth"],
      },
    )
    .refine(
      (data) => {
        // If recurrence is being set to non-weekly, dayOfWeek should not be provided
        if (
          data.recurrence !== undefined &&
          data.recurrence !== "weekly" &&
          data.dayOfWeek !== undefined &&
          data.dayOfWeek !== null
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfWeek should only be set for weekly recurrence",
        path: ["dayOfWeek"],
      },
    )
    .refine(
      (data) => {
        // If recurrence is being set to non-monthly, dayOfMonth should not be provided
        if (
          data.recurrence !== undefined &&
          data.recurrence !== "monthly" &&
          data.dayOfMonth !== undefined &&
          data.dayOfMonth !== null
        ) {
          return false;
        }
        return true;
      },
      {
        message: "dayOfMonth should only be set for monthly recurrence",
        path: ["dayOfMonth"],
      },
    ),
  z.strictObject({
    ...Schedule.shape,
    createdByMember: z.strictObject({ ...Member.shape, user: User }),
    targets: z.array(ScheduleTarget),
    deliveryTargets: z.array(ScheduleDeliveryTarget),
    deliveries: z.array(ScheduleDelivery),
  }),
);

export const deleteScheduleContract = typedContract(
  "delete /organizations/:idOrSlug/schedules/:scheduleId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
  }),
  z.strictObject({ success: z.boolean() }),
);
