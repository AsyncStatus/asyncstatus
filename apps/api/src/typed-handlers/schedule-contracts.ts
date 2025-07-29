import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Member, Schedule, ScheduleInsert, ScheduleUpdate, User } from "../db";

export const listSchedulesContract = typedContract(
  "get /organizations/:idOrSlug/schedules",
  z.strictObject({ idOrSlug: z.string() }),
  z.array(
    z.strictObject({
      ...Schedule.shape,
      createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
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
    createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
  }),
);

export const createScheduleContract = typedContract(
  "post /organizations/:idOrSlug/schedules",
  z.strictObject({
    idOrSlug: z.string(),
    name: ScheduleInsert.shape.name,
    config: ScheduleInsert.shape.config,
    isActive: ScheduleInsert.shape.isActive,
  }),
  z.strictObject({
    ...Schedule.shape,
    createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
  }),
);

export const updateScheduleContract = typedContract(
  "patch /organizations/:idOrSlug/schedules/:scheduleId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    name: ScheduleUpdate.shape.name,
    config: ScheduleUpdate.shape.config,
    isActive: ScheduleUpdate.shape.isActive,
  }),
  z.strictObject({
    ...Schedule.shape,
    createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
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
