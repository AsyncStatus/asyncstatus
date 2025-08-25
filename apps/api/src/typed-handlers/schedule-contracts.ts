import { Member, Schedule, ScheduleInsert, ScheduleUpdate, User } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export {
  ScheduleConfig,
  ScheduleConfigDeliveryMethod,
  ScheduleConfigGenerateFor,
  ScheduleConfigGenerateUpdates,
  ScheduleConfigRemindToPostUpdates,
  ScheduleConfigSendSummaries,
  ScheduleConfigSummaryFor,
  ScheduleConfigUsingActivityFrom,
  ScheduleName,
} from "@asyncstatus/db";

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

export const generateScheduleContract = typedContract(
  "post /organizations/:idOrSlug/schedules/generate",
  z.strictObject({
    idOrSlug: z.string(),
    naturalLanguageRequest: z.string().min(1),
  }),
  z.strictObject({
    success: z.boolean(),
    scheduleId: z.string().nullable(),
    scheduleRunId: z.string().nullable(),
    message: z.string(),
  }),
);

export const runScheduleContract = typedContract(
  "post /organizations/:idOrSlug/schedules/:scheduleId/run",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
  }),
  z.strictObject({
    success: z.boolean(),
    scheduleRunId: z.string(),
    message: z.string().optional(),
  }),
);
