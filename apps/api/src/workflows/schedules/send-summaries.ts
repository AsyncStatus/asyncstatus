import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import * as schema from "@asyncstatus/db";
import { createDb } from "@asyncstatus/db/create-db";
import { DiscordActivitySummaryEmail } from "@asyncstatus/email/organization/discord-activity-summary-email";
import { GithubActivitySummaryEmail } from "@asyncstatus/email/organization/github-activity-summary-email";
import { GitlabActivitySummaryEmail } from "@asyncstatus/email/organization/gitlab-activity-summary-email";
import { LinearActivitySummaryEmail } from "@asyncstatus/email/organization/linear-activity-summary-email";
import { SlackActivitySummaryEmail } from "@asyncstatus/email/organization/slack-activity-summary-email";
import { StatusUpdatesSummaryEmail } from "@asyncstatus/email/organization/status-updates-summary-email";
import { TeamStatusUpdatesSummaryEmail } from "@asyncstatus/email/organization/team-status-updates-summary-email";
import { UserStatusUpdatesSummaryEmail } from "@asyncstatus/email/organization/user-status-updates-summary-email";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { WebClient as SlackWebClient } from "@slack/web-api";
import { generateId } from "better-auth";
import { and, eq, inArray } from "drizzle-orm";
import { Resend } from "resend";
import Stripe from "stripe";
import { calculateNextScheduleExecution } from "../../lib/calculate-next-schedule-execution";
import type { HonoEnv } from "../../lib/env";
import { getOrganizationPlan } from "../../lib/get-organization-plan";
import { isTuple } from "../../lib/is-tuple";
import { postSlackMessageSafely } from "../../lib/slack-safe";
import { summarizeDiscordActivity } from "../summarization/summarize-discord-activity/summarize-discord-activity";
import { summarizeGithubActivity } from "../summarization/summarize-github-activity/summarize-github-activity";
import { summarizeGitlabActivity } from "../summarization/summarize-gitlab-activity/summarize-gitlab-activity";
import { summarizeLinearActivity } from "../summarization/summarize-linear-activity/summarize-linear-activity";
import { summarizeOrganizationStatusUpdates } from "../summarization/summarize-organization-status-updates/summarize-organization-status-updates";
import { summarizeSlackActivity } from "../summarization/summarize-slack-activity/summarize-slack-activity";
import { summarizeTeamStatusUpdates } from "../summarization/summarize-team-status-updates/summarize-team-status-updates";
import { summarizeUserStatusUpdates } from "../summarization/summarize-user-status-updates/summarize-user-status-updates";

export type SendSummariesWorkflowParams = {
  scheduleRunId: string;
  organizationId: string;
};

interface ResolvedDeliveryTarget {
  type: "email" | "slack_channel" | "discord_channel";
  target: string; // email address or channel ID
  displayName: string; // for logging
}

export class SendSummariesWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  SendSummariesWorkflowParams
> {
  async run(event: WorkflowEvent<SendSummariesWorkflowParams>, step: WorkflowStep) {
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
        organizationSlug: scheduleRun.schedule.organization.slug,
        scheduleRunExecutionCount: scheduleRun.executionCount,
        scheduleRunCreatedByMemberId: scheduleRun.createdByMemberId,
        scheduleRunLastExecutionAt: scheduleRun.lastExecutionAt,
        scheduleRunNextExecutionAt: scheduleRun.nextExecutionAt,
      };
    });

    // Step 2: Generate summaries according to schedule config and save them
    const { generatedSummaries, primarySummary } = await step.do(
      "generate-summaries",
      {
        retries: { limit: 3, delay: 30, backoff: "exponential" },
      },
      async () => {
        const openRouterProvider = createOpenRouter({ apiKey: this.env.OPENROUTER_API_KEY });
        const now = dayjs.utc();

        // Calculate time range for summary based on schedule run timing
        let effectiveFrom: string;

        if (initData.scheduleRunLastExecutionAt) {
          // Use the last execution time as the starting point
          effectiveFrom = dayjs.utc(initData.scheduleRunLastExecutionAt).toISOString();
        } else {
          // For first run, calculate based on schedule recurrence or fall back to 1 day
          const scheduleConfig = initData.scheduleConfig as schema.ScheduleConfig;
          if (scheduleConfig?.recurrence === "daily") {
            effectiveFrom = now.subtract(1, "day").startOf("day").toISOString();
          } else if (scheduleConfig?.recurrence === "weekly") {
            effectiveFrom = now.subtract(1, "week").startOf("day").toISOString();
          } else if (scheduleConfig?.recurrence === "monthly") {
            effectiveFrom = now.subtract(1, "month").startOf("day").toISOString();
          } else {
            // Default fallback
            effectiveFrom = now.subtract(1, "day").startOf("day").toISOString();
          }
        }

        const effectiveTo = now.endOf("day").toISOString();

        try {
          const stripe = new Stripe(this.env.STRIPE_SECRET_KEY);
          const orgPlan = await getOrganizationPlan(
            db,
            stripe,
            this.env.STRIPE_KV,
            organizationId,
            {
              basic: this.env.STRIPE_BASIC_PRICE_ID,
              startup: this.env.STRIPE_STARTUP_PRICE_ID,
              enterprise: this.env.STRIPE_ENTERPRISE_PRICE_ID,
            },
          );
          if (!orgPlan) {
            throw new Error("Organization plan not found");
          }

          const scheduleConfig = initData.scheduleConfig as schema.ScheduleConfigSendSummaries;
          const summaryFor =
            scheduleConfig.summaryFor && scheduleConfig.summaryFor.length > 0
              ? scheduleConfig.summaryFor
              : ([{ type: "organization", value: initData.organizationSlug }] as any);

          const generatedSummaries: Array<{
            type:
              | "organization_status_updates"
              | "team_status_updates"
              | "user_status_updates"
              | "github_activity"
              | "gitlab_activity"
              | "slack_activity"
              | "discord_activity"
              | "linear_activity";
            teamId?: string;
            userId?: string;
            content: any;
            effectiveFrom: string;
            effectiveTo: string;
          }> = [];

          // Preload members to map memberId -> userId for any member summaries
          const memberIds = summaryFor
            .filter((s: any) => s?.type === "member")
            .map((s: any) => s.value as string);
          const memberMap = new Map<string, { id: string; userId: string }>();
          if (memberIds.length > 0) {
            const members = await db.query.member.findMany({
              where: inArray(schema.member.id, memberIds),
            });
            for (const m of members) {
              if (m?.id && m?.userId) memberMap.set(m.id, { id: m.id, userId: m.userId });
            }
          }

          for (const target of summaryFor) {
            if (!target) continue;
            if (target.type === "organization") {
              const content = await summarizeOrganizationStatusUpdates({
                db,
                openRouterProvider,
                organizationId,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "organization_status_updates",
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (target.type === "team") {
              const teamId = target.value as string;
              const content = await summarizeTeamStatusUpdates({
                db,
                openRouterProvider,
                organizationId,
                teamId,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "team_status_updates",
                teamId,
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (target.type === "member") {
              const memberId = target.value as string;
              const mapped = memberMap.get(memberId);
              if (!mapped?.userId) continue;
              const content = await summarizeUserStatusUpdates({
                db,
                openRouterProvider,
                organizationId,
                userId: mapped.userId,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "user_status_updates",
                userId: mapped.userId,
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (target.type === "anyGithub" || target.type === "githubRepository") {
              const repositoryIds =
                target.type === "githubRepository" ? [target.value as string] : [];
              const content = await summarizeGithubActivity({
                db,
                openRouterProvider,
                organizationId,
                repositoryIds,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "github_activity",
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (target.type === "anySlack" || target.type === "slackChannel") {
              const channelIds = target.type === "slackChannel" ? [target.value as string] : [];
              const content = await summarizeSlackActivity({
                db,
                openRouterProvider,
                organizationId,
                channelIds,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "slack_activity",
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (target.type === "anyGitlab" || target.type === "gitlabProject") {
              const projectIds = target.type === "gitlabProject" ? [target.value as string] : [];
              const content = await summarizeGitlabActivity({
                db,
                openRouterProvider,
                organizationId,
                projectIds,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "gitlab_activity",
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (target.type === "anyDiscord" || target.type === "discordChannel") {
              const channelIds = target.type === "discordChannel" ? [target.value as string] : [];
              const content = await summarizeDiscordActivity({
                db,
                openRouterProvider,
                organizationId,
                channelIds,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "discord_activity",
                content,
                effectiveFrom,
                effectiveTo,
              });
              continue;
            }
            if (
              target.type === "anyLinear" ||
              target.type === "linearTeam" ||
              target.type === "linearProject"
            ) {
              const teamIds = target.type === "linearTeam" ? [target.value as string] : [];
              const projectIds = target.type === "linearProject" ? [target.value as string] : [];
              const content = await summarizeLinearActivity({
                db,
                openRouterProvider,
                organizationId,
                teamIds,
                projectIds,
                plan: orgPlan.plan,
                kv: this.env.STRIPE_KV,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });
              generatedSummaries.push({
                type: "linear_activity",
                content,
                effectiveFrom,
                effectiveTo,
              });
            }
          }

          if (generatedSummaries.length === 0) {
            throw new Error("No summaries generated based on schedule configuration");
          }

          const nowDate = new Date();
          const batchInserts = generatedSummaries.map((s) =>
            db.insert(schema.summary).values({
              id: generateId(),
              organizationId,
              teamId: s.teamId ?? null,
              userId: s.userId ?? null,
              type: s.type as any,
              effectiveFrom: new Date(s.effectiveFrom),
              effectiveTo: new Date(s.effectiveTo),
              content: s.content as any,
              createdAt: nowDate,
              updatedAt: nowDate,
              publishedAt: nowDate,
            }),
          );
          if (isTuple(batchInserts)) {
            await db.batch(batchInserts);
          }

          // Pick a primary summary for message delivery
          const pickByType = (t: string) => generatedSummaries.find((s) => s.type === (t as any));
          const primary =
            pickByType("organization_status_updates") ||
            pickByType("team_status_updates") ||
            pickByType("user_status_updates") ||
            pickByType("slack_activity") ||
            pickByType("github_activity") ||
            pickByType("gitlab_activity") ||
            pickByType("discord_activity") ||
            pickByType("linear_activity");

          // Normalize primary summary to shape { generalSummary, userSummaries[] }
          const primarySummary = (() => {
            if (!primary) return null as any;
            const c: any = primary.content;
            if (
              primary.type === "organization_status_updates" ||
              primary.type === "team_status_updates"
            ) {
              return {
                generalSummary: c.generalSummary ?? null,
                userSummaries: Array.isArray(c.userSummaries) ? c.userSummaries : [],
                effectiveFrom,
                effectiveTo,
              };
            }
            if (primary.type === "user_status_updates") {
              return {
                generalSummary: c.generalSummary ?? null,
                userSummaries: Array.isArray(c.items)
                  ? c.items.map((i: any) => ({ content: i.content }))
                  : [],
                effectiveFrom,
                effectiveTo,
              };
            }
            if (primary.type === "github_activity") {
              return {
                generalSummary: c.generalSummary ?? null,
                userSummaries: Array.isArray(c.repoSummaries) ? c.repoSummaries : [],
                effectiveFrom,
                effectiveTo,
              };
            }
            if (primary.type === "gitlab_activity") {
              return {
                generalSummary: c.generalSummary ?? null,
                userSummaries: Array.isArray(c.projectSummaries) ? c.projectSummaries : [],
                effectiveFrom,
                effectiveTo,
              };
            }
            if (primary.type === "linear_activity") {
              return {
                generalSummary: c.generalSummary ?? null,
                userSummaries: [
                  ...(Array.isArray(c.teamSummaries) ? c.teamSummaries : []),
                  ...(Array.isArray(c.projectSummaries) ? c.projectSummaries : []),
                ],
                effectiveFrom,
                effectiveTo,
              };
            }
            if (primary.type === "slack_activity" || primary.type === "discord_activity") {
              return {
                generalSummary: c.generalSummary ?? null,
                userSummaries: Array.isArray(c.channelSummaries) ? c.channelSummaries : [],
                effectiveFrom,
                effectiveTo,
              };
            }
            return { generalSummary: null, userSummaries: [], effectiveFrom, effectiveTo } as any;
          })();

          return { generatedSummaries, primarySummary };
        } catch (error) {
          console.error("Failed to generate summaries:", error);
          throw error;
        }
      },
    );

    // Step 3: Resolve delivery targets
    const deliveryTargets = await step.do("resolve-delivery-targets", async () => {
      const config = initData.scheduleConfig as schema.ScheduleConfigSendSummaries;
      const targets: ResolvedDeliveryTarget[] = [];

      // Get Slack integration for this organization
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

    // Step 4: Create task tracking records
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

    // Step 5: Send Slack messages
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
          const viewUpdatesLink = `${this.env.WEB_APP_URL}/${initData.organizationSlug}`;
          let allSent = true;
          const errors: string[] = [];

          for (const s of generatedSummaries) {
            const periodLine = `📅 *Period:* ${dayjs(s.effectiveFrom).format("MMM D")} - ${dayjs(s.effectiveTo).format("MMM D, YYYY")}`;

            let header = `*Summary for ${initData.organizationName}*`;
            const sections: string[] = [];

            if (s.type === "organization_status_updates") {
              header = `*Organization status updates — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Team Overview*\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.userSummaries) && s.content.userSummaries.length > 0) {
                sections.push(
                  [
                    `👥 *Individual Updates*`,
                    ...s.content.userSummaries.map((u: any) => `• ${u.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "team_status_updates") {
              header = `*Team status updates — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Team Overview*\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.userSummaries) && s.content.userSummaries.length > 0) {
                sections.push(
                  [
                    `👥 *Individual Updates*`,
                    ...s.content.userSummaries.map((u: any) => `• ${u.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "user_status_updates") {
              header = `*User status summary — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Overview*\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.items) && s.content.items.length > 0) {
                sections.push(
                  [`✅ *Highlights*`, ...s.content.items.map((i: any) => `• ${i.content}`)].join(
                    "\n",
                  ),
                );
              }
            } else if (s.type === "github_activity") {
              header = `*GitHub activity — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Overview*\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.repoSummaries) && s.content.repoSummaries.length > 0) {
                sections.push(
                  [
                    `📦 *Repository Highlights*`,
                    ...s.content.repoSummaries.map((r: any) => `• ${r.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "gitlab_activity") {
              header = `*GitLab activity — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Overview*\n${s.content.generalSummary}`);
              if (
                Array.isArray(s.content.projectSummaries) &&
                s.content.projectSummaries.length > 0
              ) {
                sections.push(
                  [
                    `📦 *Project Highlights*`,
                    ...s.content.projectSummaries.map((p: any) => `• ${p.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "slack_activity") {
              header = `*Slack activity — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Overview*\n${s.content.generalSummary}`);
              if (
                Array.isArray(s.content.channelSummaries) &&
                s.content.channelSummaries.length > 0
              ) {
                sections.push(
                  [
                    `#️⃣ *Channel Highlights*`,
                    ...s.content.channelSummaries.map((c: any) => `• ${c.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "discord_activity") {
              header = `*Discord activity — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Overview*\n${s.content.generalSummary}`);
              if (
                Array.isArray(s.content.channelSummaries) &&
                s.content.channelSummaries.length > 0
              ) {
                sections.push(
                  [
                    `#️⃣ *Channel Highlights*`,
                    ...s.content.channelSummaries.map((c: any) => `• ${c.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "linear_activity") {
              header = `*Linear activity — ${initData.organizationName}*`;
              if (s.content.generalSummary)
                sections.push(`🌟 *Overview*\n${s.content.generalSummary}`);
              if (
                Array.isArray(s.content.projectSummaries) &&
                s.content.projectSummaries.length > 0
              ) {
                sections.push(
                  [
                    `📦 *Project Highlights*`,
                    ...s.content.projectSummaries.map((p: any) => `• ${p.content}`),
                  ].join("\n"),
                );
              }
            }

            const slackMessage = [
              header,
              "",
              ...sections,
              "",
              periodLine,
              "",
              `<${viewUpdatesLink}|View details →>`,
            ].join("\n");

            try {
              await postSlackMessageSafely(slackClient, {
                channel: target.target,
                text: header,
                unfurl_links: false,
                unfurl_media: false,
                blocks: [
                  {
                    type: "section",
                    text: { type: "mrkdwn", text: slackMessage },
                  },
                ],
              });
            } catch (error) {
              allSent = false;
              const errorMessage = error instanceof Error ? error.message : String(error);
              errors.push(errorMessage);
              console.error(
                `❌ Failed to send ${s.type} Slack summary to ${target.displayName}:`,
                error,
              );
            }
          }

          if (allSent) {
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
            console.log(`✅ Sent all Slack summaries to ${target.displayName}`);
          } else {
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "failed",
                results: {
                  ...target,
                  success: false,
                  error: errors.join(" | "),
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

    // Step 6: Send Discord messages
    const discordResults = await step.do(
      "send-discord-messages",
      {
        retries: { limit: 3, delay: 10, backoff: "exponential" },
      },
      async () => {
        const discordTargets = deliveryTargets.filter((t) => t.type.startsWith("discord_"));
        if (discordTargets.length === 0) return { sent: 0, failed: 0 };

        const discordIntegration = await db.query.discordIntegration.findFirst({
          where: eq(schema.discordIntegration.organizationId, organizationId),
        });

        if (!discordIntegration) {
          console.log("No Discord integration found, skipping Discord messages");
          return { sent: 0, failed: discordTargets.length };
        }

        const botToken = discordIntegration.botAccessToken;
        let sent = 0;
        let failed = 0;

        for (const target of discordTargets) {
          const viewUpdatesLink = `${this.env.WEB_APP_URL}/${initData.organizationSlug}`;
          let allSent = true;
          const errors: string[] = [];

          for (const s of generatedSummaries) {
            const periodLine = `📅 Period: ${dayjs(s.effectiveFrom).format("MMM D")} - ${dayjs(s.effectiveTo).format("MMM D, YYYY")}`;

            let header = `Summary for ${initData.organizationName}`;
            const sections: string[] = [];

            if (s.type === "organization_status_updates") {
              header = `Organization status updates — ${initData.organizationName}`;
              if (s.content.generalSummary)
                sections.push(`🌟 Team Overview\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.userSummaries) && s.content.userSummaries.length > 0) {
                sections.push(
                  [
                    `👥 Individual Updates`,
                    ...s.content.userSummaries.map((u: any) => `• ${u.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "team_status_updates") {
              header = `Team status updates — ${initData.organizationName}`;
              if (s.content.generalSummary)
                sections.push(`🌟 Team Overview\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.userSummaries) && s.content.userSummaries.length > 0) {
                sections.push(
                  [
                    `👥 Individual Updates`,
                    ...s.content.userSummaries.map((u: any) => `• ${u.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "user_status_updates") {
              header = `User status summary — ${initData.organizationName}`;
              if (s.content.generalSummary)
                sections.push(`🌟 Overview\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.items) && s.content.items.length > 0) {
                sections.push(
                  [`✅ Highlights`, ...s.content.items.map((i: any) => `• ${i.content}`)].join(
                    "\n",
                  ),
                );
              }
            } else if (s.type === "github_activity") {
              header = `GitHub activity — ${initData.organizationName}`;
              if (s.content.generalSummary)
                sections.push(`🌟 Overview\n${s.content.generalSummary}`);
              if (Array.isArray(s.content.repoSummaries) && s.content.repoSummaries.length > 0) {
                sections.push(
                  [
                    `📦 Repository Highlights`,
                    ...s.content.repoSummaries.map((r: any) => `• ${r.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "slack_activity") {
              header = `Slack activity — ${initData.organizationName}`;
              if (s.content.generalSummary)
                sections.push(`🌟 Overview\n${s.content.generalSummary}`);
              if (
                Array.isArray(s.content.channelSummaries) &&
                s.content.channelSummaries.length > 0
              ) {
                sections.push(
                  [
                    `#️⃣ Channel Highlights`,
                    ...s.content.channelSummaries.map((c: any) => `• ${c.content}`),
                  ].join("\n"),
                );
              }
            } else if (s.type === "discord_activity") {
              header = `Discord activity — ${initData.organizationName}`;
              if (s.content.generalSummary)
                sections.push(`🌟 Overview\n${s.content.generalSummary}`);
              if (
                Array.isArray(s.content.channelSummaries) &&
                s.content.channelSummaries.length > 0
              ) {
                sections.push(
                  [
                    `#️⃣ Channel Highlights`,
                    ...s.content.channelSummaries.map((c: any) => `• ${c.content}`),
                  ].join("\n"),
                );
              }
            }

            const discordMessage = [
              header,
              "",
              ...sections,
              "",
              periodLine,
              "",
              `View details: ${viewUpdatesLink}`,
            ].join("\n");

            try {
              const resp = await fetch(
                `https://discord.com/api/v10/channels/${target.target}/messages`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bot ${botToken}`,
                  },
                  body: JSON.stringify({
                    content: discordMessage,
                    allowed_mentions: { parse: [] },
                  }),
                },
              );
              if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || `HTTP ${resp.status}`);
              }
            } catch (error) {
              allSent = false;
              const errorMessage = error instanceof Error ? error.message : String(error);
              errors.push(errorMessage);
              console.error(
                `❌ Failed to send ${s.type} Discord summary to ${target.displayName}:`,
                error,
              );
            }
          }

          if (allSent) {
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
            console.log(`✅ Sent all Discord summaries to ${target.displayName}`);
          } else {
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "failed",
                results: {
                  ...target,
                  success: false,
                  error: errors.join(" | "),
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

    // Step 7: Send emails
    const emailResults = await step.do(
      "send-emails",
      {
        retries: { limit: 3, delay: 10, backoff: "exponential" },
      },
      async () => {
        const emailTargets = deliveryTargets.filter((t) => t.type === "email");
        if (emailTargets.length === 0) return { sent: 0, failed: 0 };

        const resend = new Resend(this.env.RESEND_API_KEY);
        let sent = 0;
        let failed = 0;

        for (const target of emailTargets) {
          // Get recipient name from target display name
          const recipientName = target.displayName.includes("@")
            ? (target.displayName.split("@")[0] ?? "Team Member")
            : target.displayName;

          let allSent = true;
          const errors: string[] = [];

          for (const s of generatedSummaries) {
            try {
              const viewUpdatesLink = `${this.env.WEB_APP_URL}/${initData.organizationSlug}`;
              // Choose email template by type
              if (s.type === "organization_status_updates") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} Status updates`,
                  react: StatusUpdatesSummaryEmail({
                    preview: `Your team status summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    userSummaries: s.content.userSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "team_status_updates") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} Team status updates`,
                  react: TeamStatusUpdatesSummaryEmail({
                    preview: `Your team status summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    userSummaries: s.content.userSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "user_status_updates") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} User status summary`,
                  react: UserStatusUpdatesSummaryEmail({
                    preview: `Your status summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    items: s.content.items ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "github_activity") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} GitHub activity`,
                  react: GithubActivitySummaryEmail({
                    preview: `GitHub activity summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    repoSummaries: s.content.repoSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "gitlab_activity") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} GitLab activity`,
                  react: GitlabActivitySummaryEmail({
                    preview: `GitLab activity summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    projectSummaries: s.content.projectSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "linear_activity") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} Linear activity`,
                  react: LinearActivitySummaryEmail({
                    preview: `Linear activity summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    teamSummaries: s.content.teamSummaries ?? [],
                    projectSummaries: s.content.projectSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "slack_activity") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} Slack activity`,
                  react: SlackActivitySummaryEmail({
                    preview: `Slack activity summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    channelSummaries: s.content.channelSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              } else if (s.type === "discord_activity") {
                await resend.emails.send({
                  from: "AsyncStatus <updates@asyncstatus.com>",
                  to: target.target,
                  subject: `${initData.organizationName} Discord activity`,
                  react: DiscordActivitySummaryEmail({
                    preview: `Discord activity summary for ${initData.organizationName}`,
                    recipientName,
                    organizationName: initData.organizationName,
                    generalSummary: s.content.generalSummary ?? undefined,
                    channelSummaries: s.content.channelSummaries ?? [],
                    effectiveFrom: s.effectiveFrom,
                    effectiveTo: s.effectiveTo,
                    viewUpdatesLink,
                  }),
                });
              }
            } catch (error) {
              allSent = false;
              const errorMessage = error instanceof Error ? error.message : String(error);
              errors.push(errorMessage);
              console.error(
                `❌ Failed to send ${s.type} email summary to ${target.displayName}:`,
                error,
              );
            }
          }

          if (allSent) {
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
            console.log(`✅ Sent all email summaries to ${target.displayName}`);
          } else {
            await db
              .update(schema.scheduleRunTask)
              .set({
                status: "failed",
                results: {
                  ...target,
                  success: false,
                  error: errors.join(" | "),
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

    // Step 8: Finalize execution and schedule next run
    await step.do("finalize-execution", async () => {
      const totalSent = slackResults.sent + discordResults.sent + emailResults.sent;
      const totalFailed = slackResults.failed + discordResults.failed + emailResults.failed;
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
            discordSent: discordResults.sent,
            discordFailed: discordResults.failed,
            emailSent: emailResults.sent,
            emailFailed: emailResults.failed,
            summaryGenerated:
              !!primarySummary.generalSummary || primarySummary.userSummaries.length > 0,
            userSummariesCount: primarySummary.userSummaries.length,
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
        `🎉 Send summaries completed: ${totalSent}/${totalTargets} sent (${totalFailed} failed)`,
      );
    });
  }
}
