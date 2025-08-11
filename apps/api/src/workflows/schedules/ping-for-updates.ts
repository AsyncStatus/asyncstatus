import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import StatusUpdateReminderEmail from "@asyncstatus/email/organization/status-update-reminder-email";
import { WebClient as SlackWebClient } from "@slack/web-api";
import { generateId } from "better-auth";
import { and, eq, inArray } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import { calculateNextScheduleExecution } from "../../lib/calculate-next-schedule-execution";
import type { HonoEnv } from "../../lib/env";

export type PingForUpdatesWorkflowParams = {
  scheduleRunId: string;
  organizationId: string;
};

interface ResolvedDeliveryTarget {
  type: "email" | "slack_channel" | "discord_channel";
  target: string; // email address, channel ID, or user ID
  displayName: string; // for logging
}

export class PingForUpdatesWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  PingForUpdatesWorkflowParams
> {
  async run(event: WorkflowEvent<PingForUpdatesWorkflowParams>, step: WorkflowStep) {
    const { scheduleRunId, organizationId } = event.payload;
    const db = createDb(this.env);

    // Step 1: Initialize and get schedule details
    const initData = await step.do("initialize", async () => {
      const scheduleRun = await db.query.scheduleRun.findFirst({
        where: and(
          eq(schema.scheduleRun.id, scheduleRunId),
          eq(schema.scheduleRun.status, "pending"),
        ),
        with: {
          schedule: {
            with: {
              organization: true,
            },
          },
        },
      });

      if (!scheduleRun) {
        throw new Error("Schedule run not found or not in pending status");
      }

      if (scheduleRun.schedule.organizationId !== organizationId) {
        throw new Error("Organization ID mismatch");
      }

      if (!scheduleRun.schedule.isActive) {
        throw new Error("Schedule is not active");
      }

      // Mark schedule run as running
      await db
        .update(schema.scheduleRun)
        .set({
          status: "running",
          lastExecutionAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.scheduleRun.id, scheduleRunId));

      return {
        scheduleId: scheduleRun.schedule.id,
        scheduleConfig: scheduleRun.schedule.config,
        scheduleName: scheduleRun.schedule.name,
        scheduleIsActive: scheduleRun.schedule.isActive,
        organizationName: scheduleRun.schedule.organization.name,
        scheduleRunExecutionCount: scheduleRun.executionCount,
        scheduleRunCreatedByMemberId: scheduleRun.createdByMemberId,
      };
    });

    // Step 2: Resolve delivery targets
    const deliveryTargets = await step.do("resolve-delivery-targets", async () => {
      const config = initData.scheduleConfig as schema.ScheduleConfigRemindToPostUpdates;
      const targets: ResolvedDeliveryTarget[] = [];

      const slackIntegration = await db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.organizationId, organizationId),
      });

      const discordIntegration = await db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.organizationId, organizationId),
      });

      // Collect all IDs first to avoid N+1 queries
      const memberIds = new Set<string>();
      const teamIds = new Set<string>();
      const slackChannelIds = new Set<string>();
      const discordChannelIds = new Set<string>();
      const customEmails = new Set<string>();

      // Analyze delivery methods and collect IDs
      for (const deliveryMethod of config.deliveryMethods || []) {
        if (!deliveryMethod) continue;

        switch (deliveryMethod.type) {
          case "organization":
            break;
          case "member":
            memberIds.add(deliveryMethod.value);
            break;
          case "team":
            teamIds.add(deliveryMethod.value);
            break;
          case "slackChannel":
            slackChannelIds.add(deliveryMethod.value);
            break;
          case "discordChannel":
            discordChannelIds.add(deliveryMethod.value);
            break;
          case "customEmail":
            customEmails.add(deliveryMethod.value);
            break;
        }
      }

      // Batch query all required data
      const [members, teams, slackChannels, discordChannels, allMembersForEveryone] =
        await Promise.all([
          // Get all required members
          memberIds.size > 0
            ? db.query.member.findMany({
                where: inArray(schema.member.id, [...memberIds]),
                with: { user: true },
              })
            : [],

          // Get all required teams with their memberships
          teamIds.size > 0
            ? db.query.team.findMany({
                where: inArray(schema.team.id, [...teamIds]),
                with: {
                  teamMemberships: {
                    with: {
                      member: {
                        with: { user: true },
                      },
                    },
                  },
                },
              })
            : [],

          // Get all Slack channels
          slackChannelIds.size > 0 && slackIntegration
            ? db.query.slackChannel.findMany({
                where: inArray(schema.slackChannel.id, [...slackChannelIds]),
              })
            : [],

          // Get all Discord channels
          discordChannelIds.size > 0 && discordIntegration
            ? db.query.discordChannel.findMany({
                where: inArray(schema.discordChannel.id, [...discordChannelIds]),
              })
            : [],

          // Get all organization members if deliverToEveryone is true
          config.deliveryMethods.some((g) => g?.type === "organization")
            ? db.query.member.findMany({
                where: eq(schema.member.organizationId, organizationId),
                with: { user: true },
              })
            : [],
        ]);

      // Create lookup maps for efficient resolution
      const memberMap = new Map(members.map((m) => [m.id, m]));
      const teamMap = new Map(teams.map((t) => [t.id, t]));
      const slackChannelMap = new Map(slackChannels.map((c) => [c.id, c]));
      const discordChannelMap = new Map(discordChannels.map((c) => [c.id, c]));

      // Now resolve delivery targets using the batched data
      for (const deliveryMethod of config.deliveryMethods || []) {
        if (!deliveryMethod) continue;

        switch (deliveryMethod.type) {
          case "member": {
            const member = memberMap.get(deliveryMethod.value);
            if (member?.user.email) {
              targets.push({
                type: "email",
                target: member.user.email,
                displayName: member.user.name || member.user.email,
              });
            }
            continue;
          }

          case "slackChannel": {
            if (slackIntegration) {
              const channel = slackChannelMap.get(deliveryMethod.value);
              if (!channel) {
                console.log(
                  `Skipping Slack channel ${deliveryMethod.value} because it was not found`,
                );
                continue;
              }

              targets.push({
                type: "slack_channel",
                target: channel.channelId,
                displayName: `#${channel.name}`,
              });
            }
            continue;
          }

          case "discordChannel": {
            if (discordIntegration) {
              const channel = discordChannelMap.get(deliveryMethod.value);
              if (!channel) {
                console.log(
                  `Skipping Discord channel ${deliveryMethod.value} because it was not found`,
                );
                continue;
              }

              targets.push({
                type: "discord_channel",
                target: channel.channelId,
                displayName: `#${channel.name}`,
              });
            }
            continue;
          }

          case "customEmail": {
            customEmails.add(deliveryMethod.value);
            break;
          }

          case "team": {
            const team = teamMap.get(deliveryMethod.value);
            if (team) {
              for (const membership of team.teamMemberships) {
                if (membership.member?.user.email) {
                  targets.push({
                    type: "email",
                    target: membership.member.user.email,
                    displayName: membership.member.user.name || membership.member.user.email,
                  });
                }
              }
            }
            continue;
          }
        }
      }

      // Handle deliverToEveryone flag
      for (const member of allMembersForEveryone) {
        targets.push({
          type: "email",
          target: member.user.email,
          displayName: member.user.name || member.user.email,
        });
      }

      // Remove duplicates
      const uniqueTargets = targets.filter(
        (target, index, self) =>
          index === self.findIndex((t) => t.type === target.type && t.target === target.target),
      );

      console.log(`Resolved ${uniqueTargets.length} unique delivery targets:`, uniqueTargets);
      return uniqueTargets;
    });

    // Step 3: Create task tracking records
    await step.do("create-task-tracking", async () => {
      const tasks = deliveryTargets.map((target) => ({
        id: generateId(),
        scheduleRunId,
        status: "pending" as const,
        results: {
          type: target.type,
          target: target.target,
          displayName: target.displayName,
        },
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
      }));

      if (tasks.length > 0) {
        await db.insert(schema.scheduleRunTask).values(tasks);
      }
    });

    // Step 4: Send Slack messages
    const slackResults = await step.do(
      "send-slack-messages",
      {
        retries: { limit: 3, delay: 10, backoff: "exponential" },
      },
      async () => {
        const slackTargets = deliveryTargets.filter((t) => t.type.startsWith("slack_"));
        if (slackTargets.length === 0) return { sent: 0, failed: 0 };

        const slackIntegration = await db.query.slackIntegration.findFirst({
          where: eq(schema.slackIntegration.organizationId, organizationId),
        });

        if (!slackIntegration) {
          console.log("No Slack integration found, skipping Slack messages");
          return { sent: 0, failed: slackTargets.length };
        }

        const slackClient = new SlackWebClient(slackIntegration.botAccessToken);

        let sent = 0;
        let failed = 0;

        for (const target of slackTargets) {
          try {
            await slackClient.chat.postMessage({
              channel: target.target,
              text: "Time for status update!", // Fallback text for notifications
              unfurl_links: false,
              unfurl_media: false,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Time for status update!*\n\nWhat did you work on? What's coming up next? Any blockers?\n\n<${this.env.WEB_APP_URL}|Share your update here> →`,
                  },
                },
              ],
            });

            // Update task as completed
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "completed",
                results: {
                  ...target,
                  success: true,
                  sentAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(schema.scheduleRunTask.scheduleRunId, scheduleRunId),
                  eq(schema.scheduleRunTask.results, target as unknown as Record<string, unknown>),
                ),
              );

            sent++;
            console.log(`✅ Sent Slack message to ${target.displayName}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Failed to send Slack message to ${target.displayName}:`, error);

            // Update task as failed
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "failed",
                results: {
                  ...target,
                  success: false,
                  error: errorMessage,
                  failedAt: new Date().toISOString(),
                },
                attempts: 1,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(schema.scheduleRunTask.scheduleRunId, scheduleRunId),
                  eq(schema.scheduleRunTask.results, target as unknown as Record<string, unknown>),
                ),
              );

            failed++;
          }
        }

        return { sent, failed };
      },
    );

    // Step 5: Send emails
    const emailResults = await step.do(
      "send-emails",
      {
        retries: { limit: 3, delay: 10, backoff: "exponential" },
      },
      async () => {
        const emailTargets = deliveryTargets.filter((t) => t.type === "email");
        if (emailTargets.length === 0) return { sent: 0, failed: 0 };

        const resend = new (await import("resend")).Resend(this.env.RESEND_API_KEY);
        let sent = 0;
        let failed = 0;

        for (const target of emailTargets) {
          try {
            await resend.emails.send({
              from: "AsyncStatus <updates@asyncstatus.com>",
              to: target.target,
              subject: `Time for ${initData.organizationName} status update`,
              text: `Hi ${target.displayName},\n\nIt's time to share your status update! \n\n• What did you work on recently?\n• What are you planning next?\n• Any blockers or challenges?\n\nShare your update here: ${this.env.WEB_APP_URL}\n\nBest regards,\nThe AsyncStatus Team`,
              react: StatusUpdateReminderEmail({
                preview: `Time for ${initData.organizationName} status update`,
                recipientName: target.displayName,
                organizationName: initData.organizationName,
                updateLink: this.env.WEB_APP_URL,
              }),
            });

            // Update task as completed
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "completed",
                results: {
                  ...target,
                  success: true,
                  sentAt: new Date().toISOString(),
                },
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(schema.scheduleRunTask.scheduleRunId, scheduleRunId),
                  eq(schema.scheduleRunTask.results, target as unknown as Record<string, unknown>),
                ),
              );

            sent++;
            console.log(`✅ Sent email to ${target.displayName}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Failed to send email to ${target.displayName}:`, error);

            // Update task as failed
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "failed",
                results: {
                  ...target,
                  success: false,
                  error: errorMessage,
                  failedAt: new Date().toISOString(),
                },
                attempts: 1,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(schema.scheduleRunTask.scheduleRunId, scheduleRunId),
                  eq(schema.scheduleRunTask.results, target as unknown as Record<string, unknown>),
                ),
              );

            failed++;
          }
        }

        return { sent, failed };
      },
    );

    // Step 6: Finalize execution and schedule next run
    await step.do("finalize-execution", async () => {
      const totalSent = slackResults.sent + emailResults.sent;
      const totalFailed = slackResults.failed + emailResults.failed;
      const totalTargets = deliveryTargets.length;

      // Determine final status
      let finalStatus: "completed" | "partial" | "failed";
      if (totalFailed === 0) {
        finalStatus = "completed";
      } else if (totalSent > 0) {
        finalStatus = "partial";
      } else {
        finalStatus = "failed";
      }

      // Update current schedule run
      await db
        .update(schema.scheduleRun)
        .set({
          status: finalStatus,
          executionCount: initData.scheduleRunExecutionCount + 1,
          executionMetadata: {
            totalTargets,
            slackSent: slackResults.sent,
            slackFailed: slackResults.failed,
            emailSent: emailResults.sent,
            emailFailed: emailResults.failed,
            completedAt: new Date().toISOString(),
          },
          lastExecutionError: totalFailed > 0 ? `${totalFailed} deliveries failed` : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.scheduleRun.id, scheduleRunId));

      // Schedule next execution if schedule is still active
      if (initData.scheduleIsActive) {
        // Recreate the schedule object for next execution calculation
        const scheduleForNextExecution = {
          id: initData.scheduleId,
          config: initData.scheduleConfig,
          name: initData.scheduleName,
          isActive: initData.scheduleIsActive,
        };

        const nextExecutionTime = calculateNextScheduleExecution(scheduleForNextExecution as any);

        if (nextExecutionTime) {
          await db.insert(schema.scheduleRun).values({
            id: generateId(),
            scheduleId: initData.scheduleId,
            createdByMemberId: initData.scheduleRunCreatedByMemberId,
            status: "pending",
            nextExecutionAt: nextExecutionTime,
            executionCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          console.log(`✅ Scheduled next execution for ${nextExecutionTime.toISOString()}`);
        }
      }

      console.log(
        `🎉 Ping for updates completed: ${totalSent}/${totalTargets} sent (${totalFailed} failed)`,
      );
    });
  }
}
