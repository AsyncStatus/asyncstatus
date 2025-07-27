import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteScheduleDeliveryTargetContract,
  getScheduleDeliveryTargetContract,
  upsertScheduleDeliveryTargetContract,
} from "./schedule-delivery-target-contracts";

export const upsertScheduleDeliveryTargetHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof upsertScheduleDeliveryTargetContract
>(
  upsertScheduleDeliveryTargetContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { scheduleId, idOrSlug: _, id, ...targetData } = input;

    // First verify the schedule exists and belongs to the organization
    const existingSchedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!existingSchedule) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    // Check permissions - only admin/owner or creator can add delivery targets
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to add delivery targets to this schedule",
      });
    }

    // If teamId is provided, verify it exists and belongs to organization
    if (targetData.teamId) {
      const team = await db.query.team.findFirst({
        where: and(
          eq(schema.team.id, targetData.teamId),
          eq(schema.team.organizationId, organization.id),
        ),
      });

      if (!team) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }
    }

    // If memberId is provided, verify it exists and belongs to organization
    if (targetData.memberId) {
      const memberTarget = await db.query.member.findFirst({
        where: and(
          eq(schema.member.id, targetData.memberId),
          eq(schema.member.organizationId, organization.id),
        ),
      });

      if (!memberTarget) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }
    }

    // If slackChannelId is provided, verify it exists and belongs to organization's slack integration
    if (targetData.slackChannelId) {
      const slackChannel = await db.query.slackChannel.findFirst({
        where: eq(schema.slackChannel.id, targetData.slackChannelId),
        with: {
          integration: true,
        },
      });

      if (!slackChannel || slackChannel.integration.organizationId !== organization.id) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Slack channel not found",
        });
      }
    }

    // Perform upsert in transaction
    return await db.transaction(async (tx) => {
      const whereConditions = [eq(schema.scheduleDeliveryTarget.scheduleId, scheduleId)];

      if (id) {
        whereConditions.push(eq(schema.scheduleDeliveryTarget.id, id));
      } else {
        if (targetData.targetType === "team" && targetData.teamId) {
          whereConditions.push(eq(schema.scheduleDeliveryTarget.teamId, targetData.teamId));
        } else if (targetData.targetType === "member" && targetData.memberId) {
          whereConditions.push(eq(schema.scheduleDeliveryTarget.memberId, targetData.memberId));
        } else if (targetData.targetType === "slack_channel" && targetData.slackChannelId) {
          whereConditions.push(
            eq(schema.scheduleDeliveryTarget.slackChannelId, targetData.slackChannelId),
          );
        }
      }

      const existingTarget = await tx
        .select()
        .from(schema.scheduleDeliveryTarget)
        .where(and(...whereConditions))
        .limit(1);

      const now = new Date();

      if (existingTarget[0]) {
        // Update existing target
        const updatedTarget = await tx
          .update(schema.scheduleDeliveryTarget)
          .set({
            targetType: targetData.targetType,
            teamId: targetData.targetType === "team" ? targetData.teamId : null,
            memberId: targetData.targetType === "member" ? targetData.memberId : null,
            slackChannelId:
              targetData.targetType === "slack_channel" ? targetData.slackChannelId : null,
            updatedAt: now,
          })
          .where(eq(schema.scheduleDeliveryTarget.id, existingTarget[0].id))
          .returning();

        if (!updatedTarget || !updatedTarget[0]) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update schedule delivery target",
          });
        }

        return updatedTarget[0];
      } else {
        // Create new target
        const targetId = generateId();

        const newTarget = await tx
          .insert(schema.scheduleDeliveryTarget)
          .values({
            id: targetId,
            scheduleId: scheduleId,
            targetType: targetData.targetType,
            teamId: targetData.targetType === "team" ? targetData.teamId : null,
            memberId: targetData.targetType === "member" ? targetData.memberId : null,
            slackChannelId:
              targetData.targetType === "slack_channel" ? targetData.slackChannelId : null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!newTarget || !newTarget[0]) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create schedule delivery target",
          });
        }

        return newTarget[0];
      }
    });
  },
);

export const getScheduleDeliveryTargetHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getScheduleDeliveryTargetContract
>(
  getScheduleDeliveryTargetContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { scheduleId, targetId } = input;

    // First verify the schedule exists and belongs to the organization
    const existingSchedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!existingSchedule) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    // Find the delivery target
    const deliveryTarget = await db.query.scheduleDeliveryTarget.findFirst({
      where: and(
        eq(schema.scheduleDeliveryTarget.id, targetId),
        eq(schema.scheduleDeliveryTarget.scheduleId, scheduleId),
      ),
    });

    if (!deliveryTarget) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule delivery target not found",
      });
    }

    return deliveryTarget;
  },
);

export const deleteScheduleDeliveryTargetHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteScheduleDeliveryTargetContract
>(
  deleteScheduleDeliveryTargetContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { scheduleId, targetId } = input;

    // First verify the schedule exists and belongs to the organization
    const existingSchedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!existingSchedule) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    // Check permissions - only admin/owner or creator can delete delivery targets
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete delivery targets from this schedule",
      });
    }

    // Verify the delivery target exists and belongs to the schedule
    const existingTarget = await db.query.scheduleDeliveryTarget.findFirst({
      where: and(
        eq(schema.scheduleDeliveryTarget.id, targetId),
        eq(schema.scheduleDeliveryTarget.scheduleId, scheduleId),
      ),
    });

    if (!existingTarget) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule delivery target not found",
      });
    }

    const result = await db
      .delete(schema.scheduleDeliveryTarget)
      .where(eq(schema.scheduleDeliveryTarget.id, targetId))
      .returning();

    if (!result || result.length === 0) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete schedule delivery target",
      });
    }

    return { success: true };
  },
);
