import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { ScheduleDeliveryTarget, ScheduleDeliveryTargetInsert } from "../db";

export const getScheduleDeliveryTargetContract = typedContract(
  "get /organizations/:idOrSlug/schedules/:scheduleId/delivery-targets/:targetId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    targetId: z.string(),
  }),
  ScheduleDeliveryTarget,
);

export const upsertScheduleDeliveryTargetContract = typedContract(
  "post /organizations/:idOrSlug/schedules/:scheduleId/delivery-targets",
  z
    .strictObject({
      id: ScheduleDeliveryTargetInsert.shape.id.optional(),
      idOrSlug: z.string(),
      scheduleId: z.string(),
      targetType: ScheduleDeliveryTargetInsert.shape.targetType,
      teamId: ScheduleDeliveryTargetInsert.shape.teamId,
      memberId: ScheduleDeliveryTargetInsert.shape.memberId,
      slackChannelId: ScheduleDeliveryTargetInsert.shape.slackChannelId,
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
        if (data.targetType === "slack_channel" && !data.slackChannelId) {
          return false;
        }
        return true;
      },
      {
        message: "slackChannelId is required when targetType is 'slack_channel'",
        path: ["slackChannelId"],
      },
    )
    .refine(
      (data) => {
        if (
          data.targetType === "organization" &&
          (data.teamId || data.memberId || data.slackChannelId)
        ) {
          return false;
        }
        return true;
      },
      {
        message:
          "teamId, memberId, and slackChannelId should not be provided when targetType is 'organization'",
        path: ["targetType"],
      },
    ),
  ScheduleDeliveryTarget,
);

export const deleteScheduleDeliveryTargetContract = typedContract(
  "delete /organizations/:idOrSlug/schedules/:scheduleId/delivery-targets/:targetId",
  z.strictObject({
    idOrSlug: z.string(),
    scheduleId: z.string(),
    targetId: z.string(),
  }),
  z.strictObject({ success: z.boolean() }),
);
