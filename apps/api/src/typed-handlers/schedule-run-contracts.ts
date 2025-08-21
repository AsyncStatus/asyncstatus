import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Member, ScheduleRun, ScheduleRunTask, User } from "../db";

export const listScheduleRunsContract = typedContract(
  "get /organizations/:idOrSlug/schedules/:scheduleId/runs",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    page: z.coerce.number().default(0),
    pageSize: z.coerce.number().default(25),
  }),
  z.array(
    z.strictObject({
      ...ScheduleRun.shape,
      tasks: z.array(ScheduleRunTask),
      createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
    }),
  ),
);

export const getScheduleRunContract = typedContract(
  "get /organizations/:idOrSlug/schedule-runs/:scheduleRunId",
  z.strictObject({ idOrSlug: z.string(), scheduleRunId: z.string() }),
  z.strictObject({
    ...ScheduleRun.shape,
    tasks: z.array(ScheduleRunTask),
    createdByMember: z.strictObject({ ...Member.shape, user: User }).nullable(),
  }),
);
