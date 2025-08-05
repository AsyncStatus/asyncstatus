import { dayjs } from "@asyncstatus/dayjs";
import { and, eq, lte } from "drizzle-orm";
import type { ExecutionContext } from "hono";
import * as schema from "./db";
import { createDb } from "./db/db";
import type { HonoEnv } from "./lib/env";

export async function scheduled(
  _controller: ScheduledController,
  env: HonoEnv["Bindings"],
  ctx: ExecutionContext,
) {
  const db = createDb(env);
  const now = dayjs.utc();

  // Find schedule runs that are pending and ready to execute
  const scheduleRuns = await db.query.scheduleRun.findMany({
    where: and(
      eq(schema.scheduleRun.status, "pending"),
      lte(schema.scheduleRun.nextExecutionAt, now.toDate()),
    ),
    with: { schedule: true },
  });

  // Filter by schedule type and trigger appropriate workflows
  const pingForUpdatesScheduleRuns = scheduleRuns.filter(
    (scheduleRun) => scheduleRun.schedule.config.name === "remindToPostUpdates",
  );

  const generateUpdatesScheduleRuns = scheduleRuns.filter(
    (scheduleRun) => scheduleRun.schedule.config.name === "generateUpdates",
  );

  const sendSummariesScheduleRuns = scheduleRuns.filter(
    (scheduleRun) => scheduleRun.schedule.config.name === "sendSummaries",
  );

  // Trigger ping for updates workflows
  if (pingForUpdatesScheduleRuns.length > 0) {
    ctx.waitUntil(
      env.PING_FOR_UPDATES_WORKFLOW.createBatch(
        pingForUpdatesScheduleRuns.map((scheduleRun) => ({
          params: {
            scheduleRunId: scheduleRun.id,
            organizationId: scheduleRun.schedule.organizationId,
          },
        })),
      ),
    );
  }

  // Trigger generate updates workflows
  if (generateUpdatesScheduleRuns.length > 0) {
    ctx.waitUntil(
      env.GENERATE_STATUS_UPDATES_WORKFLOW.createBatch(
        generateUpdatesScheduleRuns.map((scheduleRun) => ({
          params: {
            scheduleRunId: scheduleRun.id,
            organizationId: scheduleRun.schedule.organizationId,
          },
        })),
      ),
    );
  }

  // Trigger send summaries workflows
  if (sendSummariesScheduleRuns.length > 0) {
    ctx.waitUntil(
      env.SEND_SUMMARIES_WORKFLOW.createBatch(
        sendSummariesScheduleRuns.map((scheduleRun) => ({
          params: {
            scheduleRunId: scheduleRun.id,
            organizationId: scheduleRun.schedule.organizationId,
          },
        })),
      ),
    );
  }

  if (
    pingForUpdatesScheduleRuns.length > 0 ||
    generateUpdatesScheduleRuns.length > 0 ||
    sendSummariesScheduleRuns.length > 0
  ) {
    console.log(
      `Triggered ${pingForUpdatesScheduleRuns.length} ping-for-updates, ${generateUpdatesScheduleRuns.length} generate-status-updates, and ${sendSummariesScheduleRuns.length} send-summaries workflows`,
    );
  }
}
