import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { ScheduleTarget, ScheduleTargetInsert } from "../db";

export const getScheduleTargetContract = typedContract(
  "get /organizations/:idOrSlug/schedules/:scheduleId/targets/:targetId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    targetId: z.string(),
  }),
  ScheduleTarget,
);

export const upsertScheduleTargetContract = typedContract(
  "post /organizations/:idOrSlug/schedules/:scheduleId/targets",
  z
    .strictObject({
      idOrSlug: z.string(),
      scheduleId: z.string(),
      id: ScheduleTargetInsert.shape.id.optional(),
      targetType: ScheduleTargetInsert.shape.targetType,
      teamId: ScheduleTargetInsert.shape.teamId,
      memberId: ScheduleTargetInsert.shape.memberId,
    })
    .refine(
      (data) => {
        if (data.targetType === "team" && !data.teamId) {
          return false;
        }
        return true;
      },
      {
        message: "teamId is required when targetType is 'team'",
        path: ["teamId"],
      },
    )
    .refine(
      (data) => {
        if (data.targetType === "member" && !data.memberId) {
          return false;
        }
        return true;
      },
      {
        message: "memberId is required when targetType is 'member'",
        path: ["memberId"],
      },
    )
    .refine(
      (data) => {
        if (data.targetType === "organization" && (data.teamId || data.memberId)) {
          return false;
        }
        return true;
      },
      {
        message: "teamId and memberId should not be provided when targetType is 'organization'",
        path: ["targetType"],
      },
    ),
  ScheduleTarget,
);

export const deleteScheduleTargetContract = typedContract(
  "delete /organizations/:idOrSlug/schedules/:scheduleId/targets/:targetId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    targetId: z.string(),
  }),
  z.strictObject({ success: z.boolean() }),
);
