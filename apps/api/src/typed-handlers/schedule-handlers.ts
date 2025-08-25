import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, asc, eq } from "drizzle-orm";
import { calculateNextScheduleExecution } from "../lib/calculate-next-schedule-execution";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { generateSchedule } from "../workflows/schedules/generate-schedule/generate-schedule";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  createScheduleContract,
  deleteScheduleContract,
  generateScheduleContract,
  getScheduleContract,
  listSchedulesContract,
  runScheduleContract,
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

export const generateScheduleHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof generateScheduleContract
>(
  generateScheduleContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, openRouterProvider, member }) => {
    const text = await generateSchedule({
      db,
      openRouterProvider,
      organizationId: organization.id,
      createdByMemberId: member.id,
      naturalLanguageRequest: input.naturalLanguageRequest,
    });

    // Try to extract IDs from tool response if the tool returned a JSON-like line
    // Our create-organization-schedule tool returns { scheduleId, scheduleRunId }
    let scheduleId: string | null = null;
    let scheduleRunId: string | null = null;
    try {
      const match = text.match(
        /\{\s*"scheduleId"\s*:\s*"([^"]*)"\s*,\s*"scheduleRunId"\s*:\s*"?([^"}]*)"?\s*\}/,
      );
      if (match) {
        scheduleId = match[1] || null;
        scheduleRunId = match[2] || null;
      }
    } catch {}

    return {
      success: true,
      scheduleId,
      scheduleRunId,
      message: text,
    };
  },
);

export const runScheduleHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof runScheduleContract
>(
  runScheduleContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member, workflow }) => {
    const { scheduleId } = input;

    const schedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!schedule) {
      throw new TypedHandlersError({ code: "NOT_FOUND", message: "Schedule not found" });
    }

    const now = dayjs.utc().toDate();
    const scheduleRunId = generateId();

    await db.insert(schema.scheduleRun).values({
      id: scheduleRunId,
      scheduleId: schedule.id,
      createdByMemberId: member.id,
      status: "pending",
      nextExecutionAt: now,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Trigger appropriate workflow based on schedule name
    const name = schedule.config.name;
    if (name === "remindToPostUpdates") {
      await workflow.pingForUpdates.create({
        params: { scheduleRunId, organizationId: organization.id },
      });
    } else if (name === "generateUpdates") {
      await workflow.generateStatusUpdates.create({
        params: { scheduleRunId, organizationId: organization.id },
      });
    } else if (name === "sendSummaries") {
      await workflow.sendSummaries.create({
        params: { scheduleRunId, organizationId: organization.id },
      });
    } else {
      throw new TypedHandlersError({ code: "BAD_REQUEST", message: "Unsupported schedule type" });
    }

    return { success: true, scheduleRunId };
  },
);
