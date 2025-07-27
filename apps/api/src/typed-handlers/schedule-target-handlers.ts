import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteScheduleTargetContract,
  getScheduleTargetContract,
  upsertScheduleTargetContract,
} from "./schedule-target-contracts";

export const upsertScheduleTargetHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof upsertScheduleTargetContract
>(
  upsertScheduleTargetContract,
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

    // Check permissions - only admin/owner or creator can add targets
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to add targets to this schedule",
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

    // Perform upsert in transaction
    return await db.transaction(async (tx) => {
      const whereConditions = [eq(schema.scheduleTarget.scheduleId, scheduleId)];

      if (id) {
        whereConditions.push(eq(schema.scheduleTarget.id, id));
      } else {
        whereConditions.push(eq(schema.scheduleTarget.targetType, targetData.targetType));
        if (targetData.targetType === "team" && targetData.teamId) {
          whereConditions.push(eq(schema.scheduleTarget.teamId, targetData.teamId));
        } else if (targetData.targetType === "member" && targetData.memberId) {
          whereConditions.push(eq(schema.scheduleTarget.memberId, targetData.memberId));
        }
      }

      const existingTarget = await tx
        .select()
        .from(schema.scheduleTarget)
        .where(and(...whereConditions))
        .limit(1);

      const now = new Date();

      if (existingTarget[0]) {
        // Update existing target
        const updatedTarget = await tx
          .update(schema.scheduleTarget)
          .set({
            targetType: targetData.targetType,
            teamId: targetData.targetType === "team" ? targetData.teamId : null,
            memberId: targetData.targetType === "member" ? targetData.memberId : null,
            updatedAt: now,
          })
          .where(eq(schema.scheduleTarget.id, existingTarget[0].id))
          .returning();

        if (!updatedTarget || !updatedTarget[0]) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update schedule target",
          });
        }

        return updatedTarget[0];
      } else {
        // Create new target
        const targetId = generateId();

        const newTarget = await tx
          .insert(schema.scheduleTarget)
          .values({
            id: targetId,
            scheduleId: scheduleId,
            targetType: targetData.targetType,
            teamId: targetData.targetType === "team" ? targetData.teamId : null,
            memberId: targetData.targetType === "member" ? targetData.memberId : null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!newTarget || !newTarget[0]) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create schedule target",
          });
        }

        return newTarget[0];
      }
    });
  },
);

export const getScheduleTargetHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getScheduleTargetContract
>(
  getScheduleTargetContract,
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

    // Find the target
    const target = await db.query.scheduleTarget.findFirst({
      where: and(
        eq(schema.scheduleTarget.id, targetId),
        eq(schema.scheduleTarget.scheduleId, scheduleId),
      ),
    });

    if (!target) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule target not found",
      });
    }

    return target;
  },
);

export const deleteScheduleTargetHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteScheduleTargetContract
>(
  deleteScheduleTargetContract,
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

    // Check permissions - only admin/owner or creator can delete targets
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete targets from this schedule",
      });
    }

    // Verify the target exists and belongs to the schedule
    const existingTarget = await db.query.scheduleTarget.findFirst({
      where: and(
        eq(schema.scheduleTarget.id, targetId),
        eq(schema.scheduleTarget.scheduleId, scheduleId),
      ),
    });

    if (!existingTarget) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule target not found",
      });
    }

    const result = await db
      .delete(schema.scheduleTarget)
      .where(eq(schema.scheduleTarget.id, targetId))
      .returning();

    if (!result || result.length === 0) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete schedule target",
      });
    }

    return { success: true };
  },
);
