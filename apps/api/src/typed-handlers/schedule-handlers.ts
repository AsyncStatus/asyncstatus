import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  createScheduleContract,
  deleteScheduleContract,
  getScheduleContract,
  listSchedulesContract,
  updateScheduleContract,
} from "./schedule-contracts";

export const listSchedulesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listSchedulesContract
>(listSchedulesContract, requiredSession, requiredOrganization, async ({ db, organization }) => {
  const schedules = await db.query.schedule.findMany({
    where: eq(schema.schedule.organizationId, organization.id),
    with: {
      createdByMember: { with: { user: true } },
    },
    orderBy: [desc(schema.schedule.createdAt)],
  });

  return schedules.map((scheduleItem) => ({
    ...scheduleItem,
    dayOfWeek: scheduleItem.dayOfWeek ?? undefined,
    dayOfMonth: scheduleItem.dayOfMonth ?? undefined,
  }));
});

export const getScheduleHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getScheduleContract
>(
  getScheduleContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { scheduleId } = input;

    const scheduleResult = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
      with: {
        createdByMember: { with: { user: true } },
      },
    });

    if (!scheduleResult) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    return {
      ...scheduleResult,
      dayOfWeek: scheduleResult.dayOfWeek ?? undefined,
      dayOfMonth: scheduleResult.dayOfMonth ?? undefined,
    };
  },
);

export const createScheduleHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof createScheduleContract
>(
  createScheduleContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const now = new Date();
    const scheduleId = generateId();

    const newSchedule = await db
      .insert(schema.schedule)
      .values({
        id: scheduleId,
        organizationId: organization.id,
        createdByMemberId: member.id,
        actionType: input.actionType,
        deliveryMethod: input.deliveryMethod,
        recurrence: input.recurrence,
        timezone: input.timezone,
        dayOfWeek: input.dayOfWeek,
        dayOfMonth: input.dayOfMonth,
        timeOfDay: input.timeOfDay,
        autoGenerateFromIntegrations: input.autoGenerateFromIntegrations ?? false,
        reminderMessageTemplate: input.reminderMessageTemplate,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!newSchedule || !newSchedule[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create schedule",
      });
    }

    const scheduleWithMember = await db.query.schedule.findFirst({
      where: eq(schema.schedule.id, scheduleId),
      with: {
        createdByMember: { with: { user: true } },
      },
    });

    if (!scheduleWithMember) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch created schedule",
      });
    }

    return {
      ...scheduleWithMember,
      dayOfWeek: scheduleWithMember.dayOfWeek ?? undefined,
      dayOfMonth: scheduleWithMember.dayOfMonth ?? undefined,
    };
  },
);

export const updateScheduleHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof updateScheduleContract
>(
  updateScheduleContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { scheduleId, ...updateData } = input;

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

    // only admin/owner or creator can update
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this schedule",
      });
    }

    const now = new Date();

    const updatedSchedule = await db
      .update(schema.schedule)
      .set({
        ...updateData,
        updatedAt: now,
      })
      .where(eq(schema.schedule.id, scheduleId))
      .returning();

    if (!updatedSchedule || !updatedSchedule[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update schedule",
      });
    }

    const scheduleWithMember = await db.query.schedule.findFirst({
      where: eq(schema.schedule.id, scheduleId),
      with: {
        createdByMember: { with: { user: true } },
      },
    });

    if (!scheduleWithMember) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch updated schedule",
      });
    }

    return {
      ...scheduleWithMember,
      dayOfWeek: scheduleWithMember.dayOfWeek ?? undefined,
      dayOfMonth: scheduleWithMember.dayOfMonth ?? undefined,
    };
  },
);

export const deleteScheduleHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteScheduleContract
>(
  deleteScheduleContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { scheduleId } = input;

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

    // Check permissions - only admin/owner or creator can delete
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete this schedule",
      });
    }

    const result = await db
      .delete(schema.schedule)
      .where(eq(schema.schedule.id, scheduleId))
      .returning();

    if (!result || result.length === 0) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete schedule",
      });
    }

    return { success: true };
  },
);
