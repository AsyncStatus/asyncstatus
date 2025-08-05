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

  ctx.waitUntil(activateDiscordGateways(db, env));
}

async function activateDiscordGateways(db: ReturnType<typeof createDb>, env: HonoEnv["Bindings"]) {
  try {
    // Find all organizations with Discord integrations
    const discordIntegrations = await db.query.discordIntegration.findMany({
      with: { organization: true },
    });

    if (discordIntegrations.length === 0) {
      return;
    }

    // Check and activate Discord Gateway for each integration
    const gatewayChecks = discordIntegrations.map(async (integration) => {
      // Skip if no Durable Object ID
      if (!integration.gatewayDurableObjectId) {
        console.log(
          `[Scheduled] No Gateway Durable Object ID for organization ${integration.organization.slug}, skipping`,
        );
        return;
      }

      const durableObject = env.DISCORD_GATEWAY_DO.get(
        env.DISCORD_GATEWAY_DO.idFromName(integration.gatewayDurableObjectId),
      );

      try {
        const status = await durableObject.getStatus();

        if (!status.isConnected) {
          console.log(
            `[Scheduled] Starting Discord Gateway for organization ${integration.organization.slug}`,
          );

          const result = await durableObject.startGateway(integration.id);

          if (result.success) {
            console.log(
              `[Scheduled] Successfully started Discord Gateway for organization ${integration.organization.slug}`,
            );
          } else {
            console.error(
              `[Scheduled] Failed to start Discord Gateway for organization ${integration.organization.slug}: ${result.message}`,
            );
          }
        }
      } catch (error) {
        console.error(
          `[Scheduled] Error checking Discord Gateway for organization ${integration.organization.slug}:`,
          error,
        );
      }
    });

    const results = await Promise.allSettled(gatewayChecks);
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      console.error(
        `[Scheduled] Failed to start Discord Gateway for ${failed.length} organizations`,
      );
    }

    console.log(
      `[Scheduled] Checked Discord Gateway status for ${discordIntegrations.length} organizations`,
    );
  } catch (error) {
    console.error("[Scheduled] Error activating Discord Gateways:", error);
  }
}
