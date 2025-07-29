import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { WebClient as SlackWebClient } from "@slack/web-api";
import { and, asc, eq } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import type { HonoEnv } from "../../lib/env";

export type PingForUpdatesWorkflowParams = {
  scheduleId: string;
  organizationId: string;
};

export class PingForUpdatesWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  PingForUpdatesWorkflowParams
> {
  async run(event: WorkflowEvent<PingForUpdatesWorkflowParams>, step: WorkflowStep) {
    const { scheduleId, organizationId } = event.payload;
    const db = createDb(this.env);

    const schedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organizationId),
        eq(schema.schedule.actionType, "pingForUpdates"),
      ),
      with: {
        deliveries: true,
        targets: {
          with: {
            member: true,
            team: { with: { teamMemberships: { with: { member: { with: { user: true } } } } } },
          },
        },
        scheduleRuns: {
          where: eq(schema.scheduleRun.status, "active"),
          orderBy: [asc(schema.scheduleRun.createdAt)],
        },
      },
    });
    if (!schedule) {
      throw new Error("Schedule not found");
    }
    const scheduleRun = schedule.scheduleRuns[0];
    if (!scheduleRun) {
      throw new Error("Schedule run not found");
    }

    const actionType = schedule.actionType;

    const shouldSendSlack = schedule.deliveries.some(
      (delivery) => delivery.deliveryMethod === "slack",
    );
    if (shouldSendSlack) {
      await step.do(
        `${actionType}-${scheduleRun.id}-slack`,
        { retries: { limit: scheduleRun.maxRetries ?? 3, delay: 60, backoff: "exponential" } },
        async () => {
          const slackIntegration = await db.query.slackIntegration.findFirst({
            where: eq(schema.slackIntegration.organizationId, organizationId),
          });
          if (!slackIntegration) {
            throw new Error("Slack integration not found");
          }

          const slackMemberIds: string[] = [];
          for (const target of schedule.targets) {
            if (target.member?.slackId) {
              slackMemberIds.push(target.member.slackId);
            }

            for (const team of target.team?.teamMemberships ?? []) {
              if (team.member?.slackId) {
                slackMemberIds.push(team.member.slackId);
              }
            }
          }

          const slackWebClient = new SlackWebClient(slackIntegration.botAccessToken);

          for (const slackMemberId of slackMemberIds) {
            await slackWebClient.chat.postMessage({
              channel: slackMemberId,
              text: `What did you do yesterday? What are you working on today? What's blocking you? ${this.env.WEB_APP_URL}`,
            });
          }
        },
      );
    }

    await step.do(
      `${actionType}-${scheduleRun.id}-finish`,
      { retries: { limit: scheduleRun.maxRetries ?? 3, delay: 60, backoff: "exponential" } },
      async () => {
        const now = dayjs.utc();
        await db
          .update(schema.scheduleRun)
          .set({
            status: "completed",
            executionStatus: "success",
            executionCount: scheduleRun.executionCount + 1,
            executionMetadata: null,
            executionError: null,
            nextRunAt: now.add(1, "day").toDate(),
            updatedAt: now.toDate(),
            executedAt: now.toDate(),
          })
          .where(eq(schema.scheduleRun.id, scheduleRun.id));
      },
    );
  }
}
