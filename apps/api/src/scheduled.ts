import { dayjs } from "@asyncstatus/dayjs";
import { and, eq, gte, lte } from "drizzle-orm";
import type { ExecutionContext } from "hono";
import * as schema from "./db";
import { createDb } from "./db/db";
import type { HonoEnv } from "./lib/env";

export async function scheduled(
  _controller: ScheduledController,
  env: HonoEnv["Bindings"],
  _ctx: ExecutionContext,
) {
  const db = createDb(env);
  const now = dayjs.utc();
  const scheduleRuns = await db.query.scheduleRun.findMany({
    where: and(
      eq(schema.scheduleRun.status, "active"),
      gte(schema.scheduleRun.lastExecutionAt, now.toDate()),
      lte(schema.scheduleRun.nextExecutionAt, now.toDate()),
    ),
    with: { schedule: true },
  });
  const pingForUpdatesScheduleRuns = scheduleRuns.filter(
    (scheduleRun) => scheduleRun.schedule.actionType === "pingForUpdates",
  );

  await env.PING_FOR_UPDATES_WORKFLOW.createBatch(
    pingForUpdatesScheduleRuns.map((scheduleRun) => ({
      params: { scheduleId: scheduleRun.scheduleId, organizationId: scheduleRun.organizationId },
    })),
  );
}
