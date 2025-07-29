import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, asc, eq } from "drizzle-orm";
import * as schema from "../db";
import { calculateNextScheduleExecution } from "../lib/calculate-next-schedule-execution";
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
    orderBy: [asc(schema.schedule.createdAt)],
  });

  return schedules;
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

    return scheduleResult;
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
    const scheduleWithMember = await db.transaction(async (tx) => {
      const now = new Date();
      const scheduleId = generateId();

      const newSchedule = await tx
        .insert(schema.schedule)
        .values({
          id: scheduleId,
          organizationId: organization.id,
          createdByMemberId: member.id,
          name: input.name,
          config: input.config as schema.ScheduleConfig,
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

      const schedule = newSchedule[0];

      // Create the initial schedule run if the schedule is active
      if (schedule.isActive) {
        const nextExecutionTime = calculateNextScheduleExecution(schedule);

        if (nextExecutionTime) {
          await tx.insert(schema.scheduleRun).values({
            id: generateId(),
            scheduleId: schedule.id,
            createdByMemberId: member.id,
            status: "pending",
            nextExecutionAt: nextExecutionTime,
            executionCount: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      const data = await tx.query.schedule.findFirst({
        where: eq(schema.schedule.id, scheduleId),
        with: {
          createdByMember: { with: { user: true } },
        },
      });

      if (!data) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch created schedule",
        });
      }

      return data;
    });

    return scheduleWithMember;
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

    const now = dayjs.utc().toDate();

    // Use transaction to ensure schedule and schedule run updates are atomic
    const scheduleWithMember = await db.transaction(async (tx) => {
      const updated = await tx
        .update(schema.schedule)
        .set({
          ...updateData,
          config: updateData.config as schema.ScheduleConfig,
          updatedAt: now,
        })
        .where(eq(schema.schedule.id, scheduleId))
        .returning();

      if (!updated || !updated[0]) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update schedule",
        });
      }

      const schedule = updated[0];

      // If schedule timing changed or activation status changed, update schedule runs
      const configChanged =
        JSON.stringify(existingSchedule.config) !== JSON.stringify(schedule.config);
      const activationChanged = existingSchedule.isActive !== schedule.isActive;

      if (configChanged || activationChanged) {
        // Cancel any pending schedule runs for this schedule
        await tx
          .update(schema.scheduleRun)
          .set({
            status: "cancelled",
            updatedAt: now,
          })
          .where(
            and(
              eq(schema.scheduleRun.scheduleId, scheduleId),
              eq(schema.scheduleRun.status, "pending"),
            ),
          );

        // Create new schedule run if schedule is active
        if (schedule.isActive) {
          const nextExecutionTime = calculateNextScheduleExecution(schedule);

          if (nextExecutionTime) {
            await tx.insert(schema.scheduleRun).values({
              id: generateId(),
              scheduleId: schedule.id,
              createdByMemberId: member.id,
              status: "pending",
              nextExecutionAt: nextExecutionTime,
              executionCount: 0,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }

      const scheduleWithMember = await tx.query.schedule.findFirst({
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

      return scheduleWithMember;
    });

    return scheduleWithMember;
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
