import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { tool } from "ai";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { calculateNextScheduleExecution } from "../../lib/calculate-next-schedule-execution";

export function createOrganizationScheduleTool(db: Db) {
  return tool({
    description: `Create a schedule for an organization. Accepts validated name and config conforming to ScheduleConfig. Returns created schedule id and schedule run id.`,
    parameters: z.object({
      organizationId: z.string(),
      createdByMemberId: z.string().optional(),
      name: schema.ScheduleNameV3,
      config: schema.ScheduleConfigV3,
      isActive: z.boolean().optional().default(true),
    }),
    execute: async (params) => {
      const now = new Date();
      const scheduleId = generateId();
      let scheduleRunId: string | null = null;

      await db.transaction(async (tx) => {
        await tx.insert(schema.schedule).values({
          id: scheduleId,
          organizationId: params.organizationId,
          createdByMemberId: params.createdByMemberId ?? null,
          name: params.name,
          config: params.config as any,
          isActive: params.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        });

        // Create initial run if schedule is active and next execution can be calculated
        if (params.isActive !== false) {
          const schedule = await tx.query.schedule.findFirst({
            where: eq(schema.schedule.id, scheduleId),
          });
          if (schedule) {
            const nextExecutionAt = calculateNextScheduleExecution(schedule as schema.Schedule);
            if (nextExecutionAt) {
              scheduleRunId = generateId();
              await tx.insert(schema.scheduleRun).values({
                id: scheduleRunId,
                scheduleId: schedule.id,
                createdByMemberId: params.createdByMemberId ?? null,
                status: "pending",
                nextExecutionAt,
                executionCount: 0,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
      });

      return { scheduleId, scheduleRunId };
    },
  });
}
