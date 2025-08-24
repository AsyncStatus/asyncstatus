import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getOrganizationPlan } from "../lib/get-organization-plan";
import { generateStatusUpdate } from "../workflows/status-updates/generate-status-update/generate-status-update";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  createStatusUpdateContract,
  deleteStatusUpdateContract,
  generateStatusUpdateContract,
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
  shareStatusUpdateContract,
  updateStatusUpdateContract,
} from "./status-update-contracts";

export const shareStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof shareStatusUpdateContract
>(
  shareStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { statusUpdateId } = input;

    const statusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.id, statusUpdateId),
        eq(schema.statusUpdate.organizationId, organization.id),
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
    if (!statusUpdate) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Status update not found",
      });
    }

    const slug = generateId();
    await db
      .update(schema.statusUpdate)
      .set({ slug })
      .where(eq(schema.statusUpdate.id, statusUpdateId));

    return { ...statusUpdate, slug };
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

    return statusUpdate;
  },
);

export const createStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof createStatusUpdateContract
>(
  createStatusUpdateContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, session, member }) => {
    const { teamId, effectiveFrom, effectiveTo, mood, emoji, isDraft, notes, items, editorJson } =
      input;

    const existingStatusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.memberId, member.id),
        eq(schema.statusUpdate.organizationId, organization.id),
        gte(schema.statusUpdate.effectiveFrom, dayjs.utc(effectiveFrom).toDate()),
        lte(schema.statusUpdate.effectiveTo, dayjs.utc(effectiveTo).toDate()),
      ),
    });

    if (existingStatusUpdate) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Status update already exists",
      });
    }

    const now = dayjs().utc().toDate();

    const statusUpdate = await db.transaction(async (tx) => {
      const statusUpdateId = generateId();

      await tx.insert(schema.statusUpdate).values({
        id: statusUpdateId,
        memberId: member.id,
        organizationId: organization.id,
        teamId: teamId,
        editorJson,
        effectiveFrom: dayjs.utc(effectiveFrom).toDate(),
        effectiveTo: dayjs.utc(effectiveTo).toDate(),
        mood,
        emoji,
        notes,
        isDraft,
        timezone: session.user.timezone,
        createdAt: now,
        updatedAt: now,
      });

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

    const now = dayjs().utc().toDate();

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
          effectiveFrom: dayjs.utc(effectiveFrom).toDate(),
          effectiveTo: dayjs.utc(effectiveTo).toDate(),
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
  async ({ db, openRouterProvider, input, organization, member, stripeClient, stripeConfig }) => {
    let generatedItems: { content: string; isBlocker: boolean; isInProgress: boolean }[] = [];
    // The frontend sends dates in UTC ISO format, so we should parse them as UTC
    const effectiveFrom = dayjs.utc(input.effectiveFrom);
    const effectiveTo = dayjs.utc(input.effectiveTo);

    try {
      // Get organization's plan
      const orgPlan = await getOrganizationPlan(
        db,
        stripeClient,
        stripeConfig.kv,
        organization.id,
        stripeConfig.priceIds,
      );

      if (!orgPlan) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      generatedItems = await generateStatusUpdate({
        db,
        openRouterProvider,
        organizationId: organization.id,
        memberId: member.id,
        plan: orgPlan.plan,
        kv: stripeConfig.kv,
        aiLimits: stripeConfig.aiLimits,
        effectiveFrom: effectiveFrom.toISOString(),
        effectiveTo: effectiveTo.toISOString(),
      });
    } catch {
      generatedItems = [];
    }

    if (generatedItems.length === 0) {
      generatedItems = [
        {
          content: "No activity found during this period",
          isBlocker: false,
          isInProgress: true,
        },
      ];
    }

    const effectiveFromStartOfDay = effectiveFrom.startOf("day").toDate();
    const effectiveToEndOfDay = effectiveTo.endOf("day").toDate();
    const nowDate = dayjs.utc().toDate();

    const statusUpdate = await db.transaction(async (tx) => {
      // Check if a status update already exists for this member on the effectiveFrom date
      const existingStatusUpdate = await tx.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.memberId, member.id),
          eq(schema.statusUpdate.organizationId, organization.id),
          gte(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDay),
          lte(schema.statusUpdate.effectiveTo, effectiveToEndOfDay),
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

      const nextEditorJson = {
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
              attrs: { checked: !item.isInProgress, blocked: item.isBlocker },
              content: [{ type: "paragraph", content: [{ type: "text", text: item.content }] }],
            })),
          },
          { type: "notesHeading" },
          {
            type: "paragraph",
            content: (existingStatusUpdate?.editorJson as any)?.content?.[3]?.content ?? [],
          },
          { type: "moodHeading" },
          {
            type: "paragraph",
            content: (existingStatusUpdate?.editorJson as any)?.content?.[5]?.content ?? [],
          },
        ],
      };

      if (existingStatusUpdate) {
        // Update existing status update
        statusUpdateId = existingStatusUpdate.id;

        // Update the updatedAt timestamp
        await tx
          .update(schema.statusUpdate)
          .set({
            editorJson: nextEditorJson,
            updatedAt: nowDate,
            isDraft: false,
            slug: existingStatusUpdate.slug ?? generateId(),
          })
          .where(eq(schema.statusUpdate.id, statusUpdateId));
      } else {
        // Create new status update
        statusUpdateId = generateId();

        await tx.insert(schema.statusUpdate).values({
          id: statusUpdateId,
          slug: generateId(),
          memberId: member.id,
          organizationId: organization.id,
          teamId: null,
          editorJson: nextEditorJson,
          effectiveFrom: effectiveFromStartOfDay,
          effectiveTo: effectiveToEndOfDay,
          mood: null,
          emoji: null,
          notes: null,
          isDraft: false,
          timezone: userTimezone,
          createdAt: nowDate,
          updatedAt: nowDate,
        });
      }

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
