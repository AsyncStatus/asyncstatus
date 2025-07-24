import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { isTuple } from "../lib/is-tuple";
import { generateStatusUpdateItems } from "../workflows/generate-status-update-items";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteStatusUpdateContract,
  generateStatusUpdateContract,
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
  listStatusUpdatesByMemberContract,
  listStatusUpdatesByTeamContract,
  listStatusUpdatesContract,
  updateStatusUpdateContract,
  upsertStatusUpdateContract,
  upsertStatusUpdateContractV2,
} from "./status-update-contracts";

export const listStatusUpdatesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listStatusUpdatesContract
>(
  listStatusUpdatesContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization }) => {
    const statusUpdates = await db.query.statusUpdate.findMany({
      where: eq(schema.statusUpdate.organizationId, organization.id),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });

    return statusUpdates;
  },
);

export const listStatusUpdatesByDateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listStatusUpdatesByDateContract
>(
  listStatusUpdatesByDateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { date, memberId, teamId } = input;

    const targetDate = dayjs.utc(date, "YYYY-MM-DD");
    if (!targetDate.isValid()) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const startOfDay = targetDate.startOf("day").toDate();
    const endOfDay = targetDate.endOf("day").toDate();

    console.log({ startOfDay, endOfDay });

    if (memberId) {
      const member = await db.query.member.findFirst({
        where: and(
          eq(schema.member.organizationId, organization.id),
          eq(schema.member.id, memberId),
        ),
      });

      if (!member) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }
    }

    if (teamId) {
      const team = await db.query.team.findFirst({
        where: and(eq(schema.team.id, teamId), eq(schema.team.organizationId, organization.id)),
      });

      if (!team) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }
    }

    const where = [
      eq(schema.statusUpdate.organizationId, organization.id),
      eq(schema.statusUpdate.isDraft, false),
      gte(schema.statusUpdate.effectiveFrom, startOfDay),
      lte(schema.statusUpdate.effectiveTo, endOfDay),
    ];

    if (memberId) {
      where.push(eq(schema.statusUpdate.memberId, memberId));
    }

    if (teamId) {
      where.push(eq(schema.statusUpdate.teamId, teamId));
    }

    const statusUpdates = await db.query.statusUpdate.findMany({
      where: and(...where),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });

    console.log({ statusUpdates });

    return statusUpdates;
  },
);

export const listStatusUpdatesByTeamHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listStatusUpdatesByTeamContract
>(
  listStatusUpdatesByTeamContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { teamId } = input;

    const team = await db.query.team.findFirst({
      where: and(eq(schema.team.id, teamId), eq(schema.team.organizationId, organization.id)),
    });

    if (!team) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    const statusUpdates = await db.query.statusUpdate.findMany({
      where: and(
        eq(schema.statusUpdate.organizationId, organization.id),
        eq(schema.statusUpdate.teamId, teamId),
      ),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });

    return statusUpdates.map((statusUpdate) => ({
      ...statusUpdate,
      // biome-ignore lint/style/noNonNullAssertion: we already checked that the team exists
      team: statusUpdate.team!,
    }));
  },
);

export const listStatusUpdatesByMemberHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listStatusUpdatesByMemberContract
>(
  listStatusUpdatesByMemberContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { memberId, isDraft, effectiveFrom } = input;

    const member = await db.query.member.findFirst({
      where: and(eq(schema.member.id, memberId), eq(schema.member.organizationId, organization.id)),
    });

    if (!member) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    const where = [
      eq(schema.statusUpdate.organizationId, organization.id),
      eq(schema.statusUpdate.memberId, memberId),
    ];

    if (typeof isDraft === "boolean" && isDraft) {
      where.push(eq(schema.statusUpdate.isDraft, true));
    } else if (typeof isDraft === "boolean" && !isDraft) {
      where.push(eq(schema.statusUpdate.isDraft, false));
    }

    if (effectiveFrom instanceof Date) {
      where.push(eq(schema.statusUpdate.effectiveFrom, effectiveFrom));
    }

    const statusUpdates = await db.query.statusUpdate.findMany({
      where: and(...where),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });

    return statusUpdates;
  },
);

export const getStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getStatusUpdateContract
>(
  getStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, session, member }) => {
    const { statusUpdateIdOrDate } = input;

    const isDate = dayjs.utc(statusUpdateIdOrDate, "YYYY-MM-DD").isValid();
    if (isDate) {
      const statusUpdate = await db.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.organizationId, organization.id),
          eq(
            schema.statusUpdate.effectiveFrom,
            dayjs.utc(statusUpdateIdOrDate, "YYYY-MM-DD").startOf("day").toDate(),
          ),
        ),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });
      if (!statusUpdate) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Status update not found",
        });
      }

      const isAdminOrOwner = member.role === "admin" || member.role === "owner";
      if (statusUpdate.isDraft && statusUpdate.member.id !== member.id && !isAdminOrOwner) {
        throw new TypedHandlersError({
          code: "FORBIDDEN",
          message: "You don't have access to this status update",
        });
      }

      return statusUpdate;
    }

    const statusUpdate = await db.query.statusUpdate.findFirst({
      where: eq(schema.statusUpdate.id, statusUpdateIdOrDate),
      with: {
        member: { with: { user: true } },
        team: true,
        items: { orderBy: (items) => [items.order] },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });
    if (!statusUpdate) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Status update not found",
      });
    }

    const isAdminOrOwner = member.role === "admin" || member.role === "owner";
    if (statusUpdate.isDraft && statusUpdate.member.id !== member.id && !isAdminOrOwner) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have access to this status update",
      });
    }

    return statusUpdate;
  },
);

export const getMemberStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getMemberStatusUpdateContract
>(
  getMemberStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { statusUpdateIdOrDate } = input;

    if (!statusUpdateIdOrDate) {
      const statusUpdate = await db.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.organizationId, organization.id),
          eq(schema.statusUpdate.memberId, member.id),
        ),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!statusUpdate) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Status update not found",
        });
      }

      return statusUpdate;
    }

    const isDate = dayjs.utc(statusUpdateIdOrDate, "YYYY-MM-DD").isValid();
    if (isDate) {
      const statusUpdate = await db.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.organizationId, organization.id),
          gte(
            schema.statusUpdate.effectiveFrom,
            dayjs.utc(statusUpdateIdOrDate, "YYYY-MM-DD").startOf("day").toDate(),
          ),
          lte(
            schema.statusUpdate.effectiveTo,
            dayjs.utc(statusUpdateIdOrDate, "YYYY-MM-DD").endOf("day").toDate(),
          ),
          eq(schema.statusUpdate.memberId, member.id),
        ),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });
      if (!statusUpdate) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Status update not found",
        });
      }

      return statusUpdate;
    }

    const statusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.id, statusUpdateIdOrDate),
        eq(schema.statusUpdate.memberId, member.id),
      ),
      with: {
        member: { with: { user: true } },
        team: true,
        items: { orderBy: (items) => [items.order] },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });
    if (!statusUpdate) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Status update not found",
      });
    }

    console.log({ statusUpdate });

    return statusUpdate;
  },
);

export const upsertStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof upsertStatusUpdateContract
>(
  upsertStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, session, member }) => {
    const { teamId, effectiveFrom, effectiveTo, mood, emoji, isDraft, notes, items, editorJson } =
      input;
    // If teamId is provided, verify it belongs to this organization
    if (teamId) {
      const team = await db.query.team.findFirst({
        where: and(eq(schema.team.id, teamId), eq(schema.team.organizationId, organization.id)),
      });

      if (!team) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }
    }

    const now = dayjs.utc().toDate();

    // Check if a status update already exists for this member on the effectiveFrom date
    const effectiveFromStartOfDay = dayjs.utc(effectiveFrom as string).startOf("day");
    const effectiveToEndOfDay = dayjs.utc(effectiveTo as string).endOf("day");
    const effectiveFromStartOfDayDate = effectiveFromStartOfDay.toDate();
    const effectiveToEndOfDayDate = effectiveToEndOfDay.toDate();

    console.log({
      effectiveFromStartOfDay: effectiveFromStartOfDay.toISOString(),
      effectiveToEndOfDay: effectiveToEndOfDay.toISOString(),
    });

    const statusUpdate = await db.transaction(async (tx) => {
      const existingStatusUpdate = await tx.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.memberId, member.id),
          eq(schema.statusUpdate.organizationId, organization.id),
          gte(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDayDate),
          lte(schema.statusUpdate.effectiveTo, effectiveToEndOfDayDate),
        ),
      });

      console.log({ existingStatusUpdate });

      const userTimezone = session.user.timezone;

      let statusUpdateId: string;
      if (existingStatusUpdate) {
        // Update existing status update
        statusUpdateId = existingStatusUpdate.id;

        await tx
          .update(schema.statusUpdate)
          .set({
            teamId: teamId === null ? null : (teamId ?? existingStatusUpdate.teamId),
            editorJson,
            effectiveFrom: effectiveFromStartOfDayDate,
            effectiveTo: effectiveToEndOfDayDate,
            mood,
            emoji,
            notes,
            isDraft,
            timezone: userTimezone,
            updatedAt: now,
          })
          .where(eq(schema.statusUpdate.id, statusUpdateId));
      } else {
        // Create new status update
        statusUpdateId = generateId();

        await tx
          .insert(schema.statusUpdate)
          .values({
            id: statusUpdateId,
            memberId: member.id,
            organizationId: organization.id,
            teamId: teamId === null ? null : (teamId ?? null),
            editorJson,
            effectiveFrom: effectiveFromStartOfDayDate,
            effectiveTo: effectiveToEndOfDayDate,
            mood,
            emoji,
            notes,
            isDraft,
            timezone: userTimezone,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
      }

      // Handle items - only insert new unique items
      if (items && items.length > 0) {
        // Get existing items for comparison
        const existingItems = existingStatusUpdate
          ? await tx.query.statusUpdateItem.findMany({
              where: eq(schema.statusUpdateItem.statusUpdateId, statusUpdateId),
            })
          : [];

        // Create a set of existing item signatures for quick lookup
        const existingItemSignatures = new Set(
          existingItems.map(
            (item) => `${item.content}|${item.isBlocker}|${item.isInProgress}|${item.order}`,
          ),
        );

        // Filter out duplicate items
        const newItems = items.filter((item) => {
          const signature = `${item.content}|${item.isBlocker}|${item.isInProgress}|${item.order}`;
          return !existingItemSignatures.has(signature);
        });

        // Only insert truly new items
        if (newItems.length > 0) {
          await tx.insert(schema.statusUpdateItem).values(
            newItems.map((item) => ({
              id: generateId(),
              statusUpdateId,
              content: item.content,
              isBlocker: item.isBlocker,
              isInProgress: item.isInProgress,
              order: item.order,
              createdAt: now,
              updatedAt: now,
            })),
          );
        }

        // Delete items that are no longer present
        if (existingStatusUpdate && existingItems.length > 0) {
          const newItemSignatures = new Set(
            items.map(
              (item) => `${item.content}|${item.isBlocker}|${item.isInProgress}|${item.order}`,
            ),
          );

          const itemsToDelete = existingItems.filter((item) => {
            const signature = `${item.content}|${item.isBlocker}|${item.isInProgress}|${item.order}`;
            return !newItemSignatures.has(signature);
          });

          if (itemsToDelete.length > 0) {
            await tx.delete(schema.statusUpdateItem).where(
              and(
                eq(schema.statusUpdateItem.statusUpdateId, statusUpdateId),
                inArray(
                  schema.statusUpdateItem.id,
                  itemsToDelete.map((item) => item.id),
                ),
              ),
            );
          }
        }
      }

      // Return the complete status update
      const result = await tx.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!result) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or update status update",
        });
      }

      return result;
    });

    return statusUpdate;
  },
);

export const upsertStatusUpdateHandlerV2 = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof upsertStatusUpdateContractV2
>(
  upsertStatusUpdateContractV2,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, session, member }) => {
    const { teamId, effectiveFrom, effectiveTo, mood, emoji, isDraft, notes, items, editorJson } =
      input;

    const existingStatusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.memberId, member.id),
        eq(schema.statusUpdate.organizationId, organization.id),
        eq(schema.statusUpdate.id, input.statusUpdateId ?? ""),
      ),
    });

    const now = dayjs.tz(dayjs.utc().toDate(), session.user.timezone).toDate();

    if (existingStatusUpdate && items && items.length > 0) {
      const batchUpdates = items
        .filter((item) => item.id)
        .map((item) => {
          return (
            db
              .update(schema.statusUpdateItem)
              .set({
                statusUpdateId: existingStatusUpdate.id,
                order: item.order,
                content: item.content,
                isBlocker: item.isBlocker,
                isInProgress: item.isInProgress,
                updatedAt: now,
              })
              // biome-ignore lint/style/noNonNullAssertion: we did filter out the items that don't have an id
              .where(eq(schema.statusUpdateItem.id, item.id!))
          );
        });
      if (isTuple(batchUpdates)) {
        await db.batch(batchUpdates);
      }
    }

    const statusUpdate = await db.transaction(async (tx) => {
      const statusUpdateId = generateId();

      await tx
        .insert(schema.statusUpdate)
        .values({
          id: statusUpdateId,
          memberId: member.id,
          organizationId: organization.id,
          teamId: teamId,
          editorJson,
          effectiveFrom: dayjs(effectiveFrom).toDate(),
          effectiveTo: dayjs(effectiveTo).toDate(),
          mood,
          emoji,
          notes,
          isDraft,
          timezone: session.user.timezone,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.statusUpdate.id,
          set: {
            memberId: member.id,
            organizationId: organization.id,
            teamId: teamId,
            editorJson,
            effectiveFrom: dayjs(effectiveFrom).toDate(),
            effectiveTo: dayjs(effectiveTo).toDate(),
            mood,
            emoji,
            notes,
            isDraft,
            timezone: session.user.timezone,
            createdAt: now,
            updatedAt: now,
          },
        });

      if (!existingStatusUpdate && items && items.length > 0) {
        await tx.insert(schema.statusUpdateItem).values(
          items.map((item) => ({
            id: generateId(),
            statusUpdateId,
            content: item.content,
            isBlocker: item.isBlocker,
            isInProgress: item.isInProgress,
            order: item.order,
            createdAt: now,
            updatedAt: now,
          })),
        );
      }

      const result = await tx.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!result) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create status update",
        });
      }

      return result;
    });

    return statusUpdate;
  },
);

export const updateStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof updateStatusUpdateContract
>(
  updateStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, session }) => {
    const {
      statusUpdateId,
      teamId,
      effectiveFrom,
      effectiveTo,
      mood,
      emoji,
      isDraft,
      notes,
      items,
      editorJson,
    } = input;

    const now = dayjs.tz(dayjs.utc().toDate(), session.user.timezone).toDate();

    const statusUpdate = await db.transaction(async (tx) => {
      const existingStatusUpdate = await tx.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.id, statusUpdateId),
          eq(schema.statusUpdate.organizationId, organization.id),
        ),
      });

      if (!existingStatusUpdate) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Status update not found",
        });
      }

      await tx
        .update(schema.statusUpdate)
        .set({
          teamId,
          editorJson,
          effectiveFrom: dayjs(effectiveFrom).toDate(),
          effectiveTo: dayjs(effectiveTo).toDate(),
          mood,
          emoji,
          notes,
          isDraft,
          timezone: session.user.timezone,
          updatedAt: now,
        })
        .where(eq(schema.statusUpdate.id, statusUpdateId));

      await tx
        .delete(schema.statusUpdateItem)
        .where(eq(schema.statusUpdateItem.statusUpdateId, statusUpdateId));

      if (items && items.length > 0) {
        await tx.insert(schema.statusUpdateItem).values(
          items.map((item) => ({
            id: generateId(),
            statusUpdateId,
            content: item.content,
            isBlocker: item.isBlocker,
            isInProgress: item.isInProgress,
            order: item.order,
            createdAt: now,
            updatedAt: now,
          })),
        );
      }

      const result = await tx.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!result) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update status update",
        });
      }

      return result;
    });

    return statusUpdate;
  },
);

export const deleteStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteStatusUpdateContract
>(
  deleteStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { statusUpdateId } = input;

    const statusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.id, statusUpdateId),
        eq(schema.statusUpdate.organizationId, organization.id),
      ),
      with: { member: true },
    });

    if (!statusUpdate) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Status update not found",
      });
    }

    // Check if user can delete this status update
    const isOwner = statusUpdate.member.id === member.id;
    const isAdmin = ["admin", "owner"].includes(member.role);

    if (!isOwner && !isAdmin) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete this status update",
      });
    }

    await db.delete(schema.statusUpdate).where(eq(schema.statusUpdate.id, statusUpdateId));

    return { success: true };
  },
);

export const generateStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof generateStatusUpdateContract
>(
  generateStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, openRouterProvider, input, organization, session, member }) => {
    let generatedItems: string[] = [];
    const effectiveFrom = dayjs.tz(input.effectiveFrom, session.user.timezone);
    const effectiveTo = dayjs.tz(input.effectiveTo, session.user.timezone);

    try {
      generatedItems = await generateStatusUpdateItems({
        db,
        openRouterProvider,
        organizationId: organization.id,
        memberId: member.id,
        effectiveFrom: effectiveFrom.toISOString(),
        effectiveTo: effectiveTo.toISOString(),
      });
    } catch {
      generatedItems = [];
    }

    // No items generated, return early
    if (generatedItems.length === 0) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "No GitHub events found to generate status update",
      });
    }

    const effectiveFromStartOfDay = effectiveFrom.startOf("day").toDate();
    const effectiveToEndOfDay = effectiveTo.endOf("day").toDate();
    const nowDate = dayjs.tz(new Date(), session.user.timezone).toDate();

    const statusUpdate = await db.transaction(async (tx) => {
      // Check if a status update already exists for this member on the effectiveFrom date
      const existingStatusUpdate = await tx.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.memberId, member.id),
          eq(schema.statusUpdate.organizationId, organization.id),
          eq(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDay),
        ),
        with: {
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      const user = await tx.query.user.findFirst({ where: eq(schema.user.id, member.userId) });
      const userTimezone = user?.timezone || "UTC";

      let statusUpdateId: string;
      let currentMaxOrder = 0;

      if (existingStatusUpdate) {
        // Update existing status update
        statusUpdateId = existingStatusUpdate.id;

        // Get the highest order from existing items
        if (existingStatusUpdate.items.length > 0) {
          currentMaxOrder = Math.max(...existingStatusUpdate.items.map((item) => item.order));
        }

        // Update the updatedAt timestamp
        await tx
          .update(schema.statusUpdate)
          .set({ updatedAt: nowDate })
          .where(eq(schema.statusUpdate.id, statusUpdateId));
      } else {
        // Create new status update
        statusUpdateId = generateId();

        await tx.insert(schema.statusUpdate).values({
          id: statusUpdateId,
          memberId: member.id,
          organizationId: organization.id,
          teamId: null,
          editorJson: {
            type: "doc",
            content: [
              {
                type: "statusUpdateHeading",
                attrs: { date: effectiveFromStartOfDay.toISOString() },
              },
              {
                type: "blockableTodoList",
                content: generatedItems.map((item) => ({
                  type: "blockableTodoListItem",
                  attrs: { checked: false, blocked: false },
                  content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
                })),
              },
              { type: "notesHeading" },
              {
                type: "paragraph",
                content: [],
              },
              { type: "moodHeading" },
              {
                type: "paragraph",
                content: [],
              },
            ],
          },
          effectiveFrom: effectiveFromStartOfDay,
          effectiveTo: effectiveToEndOfDay,
          mood: null,
          emoji: null,
          notes: null,
          isDraft: true,
          timezone: userTimezone,
          createdAt: nowDate,
          updatedAt: nowDate,
        });
      }

      // Insert the generated items
      const newItems = generatedItems.map((content, index) => ({
        id: generateId(),
        statusUpdateId,
        content: content.trim(),
        isBlocker: false,
        isInProgress: false,
        order: currentMaxOrder + index + 1, // Start from currentMaxOrder + 1
        createdAt: nowDate,
        updatedAt: nowDate,
      }));

      await tx.insert(schema.statusUpdateItem).values(newItems);

      // Return the complete status update
      const result = await tx.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!result) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or update status update",
        });
      }

      return result;
    });

    return statusUpdate;
  },
);
