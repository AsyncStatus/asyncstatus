import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import type { ExecutionContext } from "hono";
import type { HonoEnv } from "./lib/env";

export async function scheduled(
  controller: ScheduledController,
  env: HonoEnv["Bindings"],
  ctx: ExecutionContext,
) {
  const cron = controller.cron;
  console.log(controller);
  console.log(`Scheduled event: ${cron}`);

  // Handle different cron patterns
  if (cron === "* * * * *") {
    // Every minute - handle existing schedule workflows
    await handleExistingScheduleWorkflows(env, ctx);
  } else if (cron === "*/30 * * * *") {
    // Every 30 minutes - handle Discord message fetching
    await handleScheduledDiscordMessageFetch(env, ctx);
  }
}

async function handleExistingScheduleWorkflows(env: HonoEnv["Bindings"], ctx: ExecutionContext) {
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

async function handleScheduledDiscordMessageFetch(env: HonoEnv["Bindings"], ctx: ExecutionContext) {
  console.log("Starting scheduled Discord message fetch...");

  const db = createDb(env);

  try {
    // Get all active Discord integrations
    const integrations = await db.query.discordIntegration.findMany({
      where: isNull(schema.discordIntegration.deleteId),
      with: {
        organization: true,
        servers: {
          with: {
            channels: true,
          },
        },
      },
    });

    console.log(`Found ${integrations.length} active Discord integrations`);

    for (const integration of integrations) {
      try {
        // Get the most recent message for this integration to use as "after" parameter
        // We need to check across all servers for this integration
        const serverIds = integration.servers.map((server) => server.id);

        if (serverIds.length === 0) {
          console.log(`No servers found for integration ${integration.id}, skipping`);
          continue;
        }

        const lastEvent = await db.query.discordEvent.findFirst({
          where: and(
            eq(schema.discordEvent.type, "MESSAGE_CREATE"),
            inArray(schema.discordEvent.serverId, serverIds),
          ),
          orderBy: desc(schema.discordEvent.createdAt),
        });

        const after = lastEvent?.messageId;

        console.log(
          `Starting fetch workflow for integration ${integration.id}, after message: ${after || "none"}`,
        );

        // Start the fetch workflow for this integration
        const workflowInstance = await env.FETCH_DISCORD_MESSAGES_WORKFLOW.create({
          params: {
            integrationId: integration.id,
            limit: 50,
            after: after,
          },
        });

        console.log(`Started workflow ${workflowInstance.id} for integration ${integration.id}`);
      } catch (error) {
        console.error(`Error processing integration ${integration.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in scheduled Discord message fetch:", error);
  }
}
