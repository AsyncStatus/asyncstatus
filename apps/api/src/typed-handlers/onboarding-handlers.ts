import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { asc, eq, inArray } from "drizzle-orm";
import * as schema from "../db";
import type { Session } from "../lib/auth";
import { calculateNextScheduleExecution } from "../lib/calculate-next-schedule-execution";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  createOnboardingRecommendedAutomationsContract,
  updateUserOnboardingContract,
} from "./onboarding-contracts";

export const updateUserOnboardingHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof updateUserOnboardingContract
>(updateUserOnboardingContract, requiredSession, async ({ db, session, input, authKv }) => {
  const updates: Partial<typeof updateUserOnboardingContract.$infer.input> = {};

  if (input.showOnboarding !== undefined) {
    updates.showOnboarding = input.showOnboarding;
  }

  if (input.onboardingStep !== undefined) {
    updates.onboardingStep = input.onboardingStep;
  }

  if (input.onboardingCompletedAt !== undefined) {
    updates.onboardingCompletedAt = input.onboardingCompletedAt;
  }

  await db
    .update(schema.user)
    .set(updates as any)
    .where(eq(schema.user.id, session.user.id));

  const data = await authKv.get<Session>(session.session.token, {
    type: "json",
  });
  if (!data) {
    throw new TypedHandlersError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }
  await authKv.put(
    session.session.token,
    JSON.stringify({ ...data, user: { ...data.user, ...updates } }),
  );

  const user = await db.query.user.findFirst({ where: eq(schema.user.id, session.user.id) });
  if (!user) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return user;
});

export const createOnboardingRecommendedAutomationsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof createOnboardingRecommendedAutomationsContract
>(
  createOnboardingRecommendedAutomationsContract,
  requiredSession,
  requiredOrganization,
  async (ctx) => {
    const { db, organization, member, session } = ctx;
    const existingSchedules = await db.query.schedule.findMany({
      where: eq(schema.schedule.organizationId, organization.id),
      with: { createdByMember: { with: { user: true } } },
      orderBy: [asc(schema.schedule.createdAt)],
    });
    if (existingSchedules.length > 0) {
      return existingSchedules;
    }

    // Fetch integrations and channels
    const [slackIntegration, discordIntegration, githubIntegration] = await Promise.all([
      db.query.slackIntegration.findFirst({
        where: eq(schema.slackIntegration.organizationId, organization.id),
      }),
      db.query.discordIntegration.findFirst({
        where: eq(schema.discordIntegration.organizationId, organization.id),
      }),
      db.query.githubIntegration.findFirst({
        where: eq(schema.githubIntegration.organizationId, organization.id),
      }),
    ]);

    const [slackChannels, discordServers] = await Promise.all([
      slackIntegration
        ? db.query.slackChannel.findMany({
            where: eq(schema.slackChannel.integrationId, slackIntegration.id),
            orderBy: [asc(schema.slackChannel.isGeneral), asc(schema.slackChannel.name)],
          })
        : [],
      discordIntegration
        ? db.query.discordServer.findMany({
            where: eq(schema.discordServer.integrationId, discordIntegration.id),
            with: { channels: true },
          })
        : [],
    ]);

    // Pick a preferred channel id for delivery
    const preferredSlackChannelId =
      slackChannels.find((c) => c.isGeneral)?.id ?? slackChannels[0]?.id;
    const allDiscordChannels = discordServers.flatMap((s) => s.channels);
    const preferredDiscordChannelId =
      allDiscordChannels.find((c) => c.type === 0)?.id ?? allDiscordChannels[0]?.id;

    // Build delivery methods: prefer Slack, else Discord, plus email to everyone
    const deliveryMethods: schema.ScheduleConfigSendSummaries["deliveryMethods"] = [] as any;
    if (preferredSlackChannelId) {
      deliveryMethods.push({
        type: "slackChannel",
        value: preferredSlackChannelId as string,
      } as any);
    } else if (preferredDiscordChannelId) {
      deliveryMethods.push({
        type: "discordChannel",
        value: preferredDiscordChannelId as string,
      } as any);
    }
    deliveryMethods.push({ type: "organization", value: organization.slug } as any);

    // Schedules to create: generateUpdates daily for org; sendSummaries weekly to chosen channel + org email
    const now = new Date();
    const timezone = session.user.timezone || "UTC";
    const schedulesToInsert: Array<schema.ScheduleInsert> = [
      {
        id: generateId(),
        organizationId: organization.id,
        createdByMemberId: member.id,
        name: "generateUpdates",
        config: {
          name: "generateUpdates",
          timeOfDay: "09:30",
          timezone,
          recurrence: "daily",
          generateFor: [
            {
              type: "organization",
              value: organization.slug,
              usingActivityFrom: [{ type: "anyIntegration", value: "anyIntegration" }],
            },
          ],
        } as any,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        organizationId: organization.id,
        createdByMemberId: member.id,
        name: "sendSummaries",
        config: {
          name: "sendSummaries",
          timeOfDay: "16:00",
          timezone,
          recurrence: "weekly",
          dayOfWeek: 4,
          summaryFor: [
            { type: "organization", value: organization.slug },
            ...(githubIntegration ? [{ type: "anyGithub", value: "anyGithub" } as const] : []),
            ...(slackIntegration ? [{ type: "anySlack", value: "anySlack" } as const] : []),
            ...(discordIntegration ? [{ type: "anyDiscord", value: "anyDiscord" } as const] : []),
          ],
          deliveryMethods,
        } as any,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const createdSchedules = await db.transaction(async (tx) => {
      // Insert schedules
      await tx.insert(schema.schedule).values(schedulesToInsert);

      // Create initial runs
      for (const inserted of schedulesToInsert) {
        const nextExecutionAt = calculateNextScheduleExecution(inserted as any);
        if (nextExecutionAt) {
          await tx.insert(schema.scheduleRun).values({
            id: generateId(),
            scheduleId: inserted.id,
            createdByMemberId: member.id,
            status: "pending",
            nextExecutionAt,
            executionCount: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // Return only the schedules we created with creator info
      const results = await tx.query.schedule.findMany({
        where: inArray(
          schema.schedule.id,
          schedulesToInsert.map((s) => s.id),
        ),
        with: { createdByMember: { with: { user: true } } },
        orderBy: [asc(schema.schedule.createdAt)],
      });
      return results;
    });

    return createdSchedules;
  },
);
