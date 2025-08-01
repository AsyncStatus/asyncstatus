import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { dayjs } from "@asyncstatus/dayjs";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateId } from "better-auth";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import * as schema from "../../db";
import { createDb } from "../../db/db";
import { calculateNextScheduleExecution } from "../../lib/calculate-next-schedule-execution";
import type { HonoEnv } from "../../lib/env";
import { getOrganizationPlan } from "../../lib/get-organization-plan";
import { generateStatusUpdate } from "../status-updates/generate-status-update/generate-status-update";

export type GenerateStatusUpdatesWorkflowParams = {
  scheduleRunId: string;
  organizationId: string;
};

interface ResolvedGenerationTarget {
  memberId: string;
  userId: string;
  displayName: string;
}

export class GenerateStatusUpdatesWorkflow extends WorkflowEntrypoint<
  HonoEnv["Bindings"],
  GenerateStatusUpdatesWorkflowParams
> {
  async run(event: WorkflowEvent<GenerateStatusUpdatesWorkflowParams>, step: WorkflowStep) {
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

    // Step 2: Resolve generation targets (members who need status updates)
    const generationTargets = await step.do("resolve-generation-targets", async () => {
      const config = initData.scheduleConfig as schema.ScheduleConfigGenerateUpdates;
      const targets: ResolvedGenerationTarget[] = [];

      // Collect all IDs first to avoid N+1 queries
      const memberIds = new Set<string>();
      const teamIds = new Set<string>();

      // Analyze generateFor methods and collect IDs
      for (const generateFor of config.generateFor || []) {
        if (!generateFor) continue;

        switch (generateFor.type) {
          case "member":
            memberIds.add(generateFor.value);
            break;
          case "team":
            teamIds.add(generateFor.value);
            break;
        }
      }

      // Batch query all required data
      const [members, teams, allMembersForEveryone] = await Promise.all([
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

        // Get all organization members if generateForEveryMember is true
        config.generateForEveryMember
          ? db.query.member.findMany({
              where: eq(schema.member.organizationId, organizationId),
              with: { user: true },
            })
          : [],
      ]);

      // Create lookup maps for efficient resolution
      const memberMap = new Map(members.map((m) => [m.id, m]));
      const teamMap = new Map(teams.map((t) => [t.id, t]));

      // Now resolve generation targets using the batched data
      for (const generateFor of config.generateFor || []) {
        if (!generateFor) continue;

        switch (generateFor.type) {
          case "member": {
            const member = memberMap.get(generateFor.value);
            if (member?.user) {
              targets.push({
                memberId: member.id,
                userId: member.userId,
                displayName: member.user.name || member.user.email,
              });
            }
            continue;
          }

          case "team": {
            const team = teamMap.get(generateFor.value);
            if (team) {
              for (const membership of team.teamMemberships) {
                if (membership.member?.user) {
                  targets.push({
                    memberId: membership.member.id,
                    userId: membership.member.userId,
                    displayName: membership.member.user.name || membership.member.user.email,
                  });
                }
              }
            }
            continue;
          }
        }
      }

      // Handle generateForEveryMember flag
      for (const member of allMembersForEveryone) {
        if (member.user) {
          targets.push({
            memberId: member.id,
            userId: member.userId,
            displayName: member.user.name || member.user.email,
          });
        }
      }

      // Remove duplicates
      const uniqueTargets = targets.filter(
        (target, index, self) => index === self.findIndex((t) => t.memberId === target.memberId),
      );

      console.log(`Resolved ${uniqueTargets.length} unique generation targets:`, uniqueTargets);
      return uniqueTargets;
    });

    // Step 3: Create task tracking records
    await step.do("create-task-tracking", async () => {
      const tasks = generationTargets.map((target) => ({
        id: generateId(),
        scheduleRunId,
        status: "pending" as const,
        results: {
          type: "generate_status",
          memberId: target.memberId,
          userId: target.userId,
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

    // Step 4: Generate status updates in batches of 10
    const generationResults = await step.do(
      "generate-status-updates",
      {
        retries: { limit: 3, delay: 30, backoff: "exponential" },
      },
      async () => {
        if (generationTargets.length === 0) return { generated: 0, failed: 0 };

        const openRouterProvider = createOpenRouter({ apiKey: this.env.OPENROUTER_API_KEY });
        const now = dayjs.utc();

        // Calculate time range for status update (typically yesterday to today)
        const effectiveFrom = now.subtract(1, "day").startOf("day").toISOString();
        const effectiveTo = now.startOf("day").toISOString();

        let generated = 0;
        let failed = 0;

        // Process in batches of 10
        const batchSize = 10;
        for (let i = 0; i < generationTargets.length; i += batchSize) {
          const batch = generationTargets.slice(i, i + batchSize);

          // Process batch in parallel
          const batchPromises = batch.map(async (target) => {
            try {
              // Get organization's plan
              const { plan: orgPlan, stripeCustomerId } = await getOrganizationPlan(
                db,
                this.env.STRIPE_SECRET_KEY,
                this.env.STRIPE_KV,
                organizationId,
                {
                  basic: this.env.STRIPE_BASIC_PRICE_ID,
                  startup: this.env.STRIPE_STARTUP_PRICE_ID,
                  enterprise: this.env.STRIPE_ENTERPRISE_PRICE_ID,
                },
              );

              // Generate status update items using AI
              const generatedItems = await generateStatusUpdate({
                db,
                openRouterProvider,
                organizationId,
                memberId: target.memberId,
                plan: orgPlan,
                kv: this.env.STRIPE_KV,
                stripeSecretKey: this.env.STRIPE_SECRET_KEY,
                stripeCustomerId,
                aiLimits: {
                  basic: parseInt(this.env.AI_BASIC_MONTHLY_LIMIT),
                  startup: parseInt(this.env.AI_STARTUP_MONTHLY_LIMIT),
                  enterprise: parseInt(this.env.AI_ENTERPRISE_MONTHLY_LIMIT),
                },
                effectiveFrom,
                effectiveTo,
              });

              // Skip if no items generated
              if (generatedItems.length === 0) {
                console.log(`No activity found for ${target.displayName}, skipping`);
                return { success: false, reason: "no_activity" };
              }

              // Create or update status update using same logic as handler
              const statusUpdateId = await db.transaction(async (tx) => {
                const effectiveFromDate = dayjs.utc(effectiveFrom).startOf("day").toDate();
                const effectiveToDate = dayjs.utc(effectiveTo).endOf("day").toDate();
                const nowDate = now.toDate();

                // Check if a status update already exists
                const existingStatusUpdate = await tx.query.statusUpdate.findFirst({
                  where: and(
                    eq(schema.statusUpdate.memberId, target.memberId),
                    eq(schema.statusUpdate.organizationId, organizationId),
                    gte(schema.statusUpdate.effectiveFrom, effectiveFromDate),
                    lte(schema.statusUpdate.effectiveTo, effectiveToDate),
                  ),
                  with: {
                    items: {
                      orderBy: (items) => [items.order],
                    },
                  },
                });

                const user = await tx.query.user.findFirst({
                  where: eq(schema.user.id, target.userId),
                });
                const userTimezone = user?.timezone || "UTC";

                let statusUpdateId: string;

                const nextEditorJson = {
                  type: "doc",
                  content: [
                    {
                      type: "statusUpdateHeading",
                      attrs: { date: effectiveFromDate.toISOString() },
                    },
                    {
                      type: "blockableTodoList",
                      content: generatedItems.map((item) => ({
                        type: "blockableTodoListItem",
                        attrs: { checked: !item.isInProgress, blocked: item.isBlocker },
                        content: [
                          { type: "paragraph", content: [{ type: "text", text: item.content }] },
                        ],
                      })),
                    },
                    { type: "notesHeading" },
                    {
                      type: "paragraph",
                      content:
                        (existingStatusUpdate?.editorJson as any)?.content?.[3]?.content ?? [],
                    },
                    { type: "moodHeading" },
                    {
                      type: "paragraph",
                      content:
                        (existingStatusUpdate?.editorJson as any)?.content?.[5]?.content ?? [],
                    },
                  ],
                };

                if (existingStatusUpdate) {
                  // Update existing status update
                  statusUpdateId = existingStatusUpdate.id;

                  await tx
                    .update(schema.statusUpdate)
                    .set({ editorJson: nextEditorJson, updatedAt: nowDate })
                    .where(eq(schema.statusUpdate.id, statusUpdateId));
                } else {
                  // Create new status update
                  statusUpdateId = generateId();

                  await tx.insert(schema.statusUpdate).values({
                    id: statusUpdateId,
                    memberId: target.memberId,
                    organizationId,
                    teamId: null,
                    editorJson: nextEditorJson,
                    effectiveFrom: effectiveFromDate,
                    effectiveTo: effectiveToDate,
                    mood: null,
                    emoji: null,
                    notes: null,
                    isDraft: true,
                    timezone: userTimezone,
                    createdAt: nowDate,
                    updatedAt: nowDate,
                  });
                }

                // Replace status update items
                await tx
                  .delete(schema.statusUpdateItem)
                  .where(eq(schema.statusUpdateItem.statusUpdateId, statusUpdateId));

                await tx.insert(schema.statusUpdateItem).values(
                  generatedItems.map((content, index) => ({
                    id: generateId(),
                    statusUpdateId,
                    content: content.content,
                    isBlocker: content.isBlocker,
                    isInProgress: content.isInProgress,
                    order: index + 1,
                    createdAt: nowDate,
                    updatedAt: nowDate,
                  })),
                );

                return statusUpdateId;
              });

              // Update task as completed
              await db
                .update(schema.scheduleRunTask)
                .set({
                  status: "completed",
                  results: {
                    ...target,
                    success: true,
                    statusUpdateId,
                    itemCount: generatedItems.length,
                    generatedAt: new Date().toISOString(),
                  },
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.scheduleRunTask.scheduleRunId, scheduleRunId),
                    eq(
                      schema.scheduleRunTask.results,
                      target as unknown as Record<string, unknown>,
                    ),
                  ),
                );

              console.log(
                `✅ Generated status update for ${target.displayName} (${generatedItems.length} items)`,
              );
              return { success: true };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(
                `❌ Failed to generate status update for ${target.displayName}:`,
                error,
              );

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
                    eq(
                      schema.scheduleRunTask.results,
                      target as unknown as Record<string, unknown>,
                    ),
                  ),
                );

              return { success: false, error: errorMessage };
            }
          });

          // Wait for batch to complete
          const batchResults = await Promise.all(batchPromises);

          // Count results
          batchResults.forEach((result) => {
            if (result.success) {
              generated++;
            } else {
              failed++;
            }
          });

          console.log(
            `Batch ${Math.floor(i / batchSize) + 1} completed: ${batchResults.filter((r) => r.success).length}/${batch.length} successful`,
          );
        }

        return { generated, failed };
      },
    );

    // Step 5: Finalize execution and schedule next run
    await step.do("finalize-execution", async () => {
      const totalTargets = generationTargets.length;
      const totalGenerated = generationResults.generated;
      const totalFailed = generationResults.failed;

      // Determine final status
      let finalStatus: "completed" | "partial" | "failed";
      if (totalFailed === 0) {
        finalStatus = "completed";
      } else if (totalGenerated > 0) {
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
            generated: totalGenerated,
            failed: totalFailed,
            completedAt: new Date().toISOString(),
          },
          lastExecutionError: totalFailed > 0 ? `${totalFailed} generations failed` : null,
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
        `🎉 Generate status updates completed: ${totalGenerated}/${totalTargets} generated (${totalFailed} failed)`,
      );
    });
  }
}
