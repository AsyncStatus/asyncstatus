import { dayjs } from "@asyncstatus/dayjs";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import {
  addCliStatusUpdateItemContract,
  editCliStatusUpdateContract,
  getCliStatusUpdateByDateContract,
  listRecentStatusUpdatesContract,
  showCurrentStatusUpdateContract,
  undoLastCliStatusUpdateItemContract,
} from "./cli-contracts";
import { requiredActiveOrganization, requiredJwt } from "./middleware";

export const addCliStatusUpdateItemHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof addCliStatusUpdateItemContract
>(
  addCliStatusUpdateItemContract,
  requiredJwt,
  requiredActiveOrganization,
  async ({ db, input, session, organization, member }) => {
    const { type, message } = input;

    // Get current date in user's timezone for the status update
    const now = dayjs().utc();
    const effectiveFromStartOfDay = now.startOf("day").toDate();
    const effectiveToEndOfDay = now.endOf("day").toDate();
    const nowDate = now.toDate();

    const statusUpdate = await db.transaction(async (tx) => {
      // Check if a status update already exists for this member on today's date
      let existingStatusUpdate = await tx.query.statusUpdate.findFirst({
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

      let statusUpdateId: string;

      if (existingStatusUpdate) {
        // Update existing status update
        statusUpdateId = existingStatusUpdate.id;

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
          editorJson: null,
          effectiveFrom: effectiveFromStartOfDay,
          effectiveTo: effectiveToEndOfDay,
          mood: null,
          emoji: null,
          notes: null,
          isDraft: false,
          timezone: session.user.timezone || "UTC",
          createdAt: nowDate,
          updatedAt: nowDate,
        });

        // Refresh the existing status update data
        existingStatusUpdate = await tx.query.statusUpdate.findFirst({
          where: eq(schema.statusUpdate.id, statusUpdateId),
          with: {
            items: {
              orderBy: (items) => [items.order],
            },
          },
        });
      }

      // Determine the next order for the new item
      const nextOrder = (existingStatusUpdate?.items?.length || 0) + 1;

      // Determine item properties based on type
      const isInProgress = type === "progress";
      const isBlocker = type === "blocker";

      // Add the new status update item
      await tx.insert(schema.statusUpdateItem).values({
        id: generateId(),
        statusUpdateId,
        content: message,
        isBlocker,
        isInProgress,
        order: nextOrder,
        createdAt: nowDate,
        updatedAt: nowDate,
      });

      // Get all items after adding the new one to update editorJson
      const allItems = await tx.query.statusUpdateItem.findMany({
        where: eq(schema.statusUpdateItem.statusUpdateId, statusUpdateId),
        orderBy: (items) => [items.order],
      });

      // Update editorJson with all items
      const nextEditorJson = {
        type: "doc",
        content: [
          {
            type: "statusUpdateHeading",
            attrs: { date: effectiveFromStartOfDay.toISOString() },
          },
          {
            type: "blockableTodoList",
            content: allItems.map((item) => ({
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

      // Update the status update with the new editorJson
      await tx
        .update(schema.statusUpdate)
        .set({ editorJson: nextEditorJson, updatedAt: nowDate, isDraft: false })
        .where(eq(schema.statusUpdate.id, statusUpdateId));

      // Return the complete status update with all items
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

export const undoLastCliStatusUpdateItemHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof undoLastCliStatusUpdateItemContract
>(
  undoLastCliStatusUpdateItemContract,
  requiredJwt,
  requiredActiveOrganization,
  async ({ db, organization, member }) => {
    const now = dayjs().utc();
    const effectiveFromStartOfDay = now.startOf("day").toDate();
    const effectiveToEndOfDay = now.endOf("day").toDate();

    const result = await db.transaction(async (tx) => {
      const statusUpdate = await tx.query.statusUpdate.findFirst({
        where: and(
          eq(schema.statusUpdate.memberId, member.id),
          eq(schema.statusUpdate.organizationId, organization.id),
          gte(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDay),
          lte(schema.statusUpdate.effectiveTo, effectiveToEndOfDay),
        ),
        with: {
          items: {
            orderBy: (items) => [desc(items.order)], // Get items ordered by order desc to get the last one first
          },
        },
      });

      if (!statusUpdate) {
        return {
          success: false,
          deletedStatusUpdate: false,
          message: "No status updates found to remove",
        };
      }

      if (!statusUpdate.items || statusUpdate.items.length === 0) {
        return {
          success: false,
          deletedStatusUpdate: false,
          message: "No status update items found to remove",
        };
      }

      // Remove the last item (first in desc order)
      const lastItem = statusUpdate.items[0];
      if (!lastItem) {
        return {
          success: false,
          deletedStatusUpdate: false,
          message: "No status update items found to remove",
        };
      }

      await tx.delete(schema.statusUpdateItem).where(eq(schema.statusUpdateItem.id, lastItem.id));

      // Check if there are any remaining items
      const remainingItems = await tx.query.statusUpdateItem.findMany({
        where: eq(schema.statusUpdateItem.statusUpdateId, statusUpdate.id),
      });

      if (remainingItems.length === 0) {
        // No items left, delete the entire status update
        await tx.delete(schema.statusUpdate).where(eq(schema.statusUpdate.id, statusUpdate.id));

        return {
          success: true,
          deletedStatusUpdate: true,
          message: "Status update item and empty status update removed successfully",
        };
      } else {
        // Update editorJson with remaining items
        const nextEditorJson = {
          type: "doc",
          content: [
            {
              type: "statusUpdateHeading",
              attrs: { date: effectiveFromStartOfDay.toISOString() },
            },
            {
              type: "blockableTodoList",
              content: remainingItems.map((item) => ({
                type: "blockableTodoListItem",
                attrs: { checked: !item.isInProgress, blocked: item.isBlocker },
                content: [{ type: "paragraph", content: [{ type: "text", text: item.content }] }],
              })),
            },
            { type: "notesHeading" },
            {
              type: "paragraph",
              content: (statusUpdate?.editorJson as any)?.content?.[3]?.content ?? [],
            },
            { type: "moodHeading" },
            {
              type: "paragraph",
              content: (statusUpdate?.editorJson as any)?.content?.[5]?.content ?? [],
            },
          ],
        };

        // Update the status update with new editorJson and updatedAt timestamp
        await tx
          .update(schema.statusUpdate)
          .set({ editorJson: nextEditorJson, updatedAt: dayjs().utc().toDate(), isDraft: false })
          .where(eq(schema.statusUpdate.id, statusUpdate.id));

        return {
          success: true,
          deletedStatusUpdate: false,
          message: "Status update item removed successfully",
        };
      }
    });

    return result;
  },
);

export const showCurrentStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof showCurrentStatusUpdateContract
>(
  showCurrentStatusUpdateContract,
  requiredJwt,
  requiredActiveOrganization,
  async ({ db, organization, member }) => {
    const now = dayjs().utc();
    const effectiveFromStartOfDay = now.startOf("day").toDate();
    const effectiveToEndOfDay = now.endOf("day").toDate();

    const statusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.memberId, member.id),
        eq(schema.statusUpdate.organizationId, organization.id),
        gte(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDay),
        lte(schema.statusUpdate.effectiveTo, effectiveToEndOfDay),
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
      return {
        statusUpdate: null,
        message: "No status update found for today",
      };
    }

    return {
      statusUpdate,
      message: "Current status update retrieved successfully",
    };
  },
);

export const listRecentStatusUpdatesHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listRecentStatusUpdatesContract
>(
  listRecentStatusUpdatesContract,
  requiredJwt,
  requiredActiveOrganization,
  async ({ db, organization, member, input }) => {
    const { days = 1 } = input;

    const now = dayjs().utc();
    const startDate = now
      .subtract(days as number, "day")
      .startOf("day")
      .toDate();
    const endDate = now.endOf("day").toDate();

    // Find status updates for this member within the date range
    const statusUpdates = await db.query.statusUpdate.findMany({
      where: and(
        eq(schema.statusUpdate.memberId, member.id),
        eq(schema.statusUpdate.organizationId, organization.id),
        gte(schema.statusUpdate.effectiveFrom, startDate),
        lte(schema.statusUpdate.effectiveTo, endDate),
      ),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdate) => [desc(statusUpdate.effectiveFrom)],
    });

    return {
      statusUpdates,
      message: `Found ${statusUpdates.length} status update(s) from the last ${days} day(s)`,
    };
  },
);

export const editCliStatusUpdateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof editCliStatusUpdateContract
>(
  editCliStatusUpdateContract,
  requiredJwt,
  requiredActiveOrganization,
  async ({ db, input, session, organization, member }) => {
    const { items, date, mood, notes } = input;

    // Parse the target date or use today
    const targetDate = date ? dayjs.utc(date) : dayjs().utc();
    const effectiveFromStartOfDay = targetDate.startOf("day").toDate();
    const effectiveToEndOfDay = targetDate.endOf("day").toDate();
    const nowDate = dayjs().utc().toDate();

    const statusUpdate = await db.transaction(async (tx) => {
      // Check if a status update already exists for this member on the target date
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

      let statusUpdateId: string;

      if (existingStatusUpdate) {
        // Update existing status update
        statusUpdateId = existingStatusUpdate.id;

        // Delete all existing items
        await tx
          .delete(schema.statusUpdateItem)
          .where(eq(schema.statusUpdateItem.statusUpdateId, statusUpdateId));

        // Update the updatedAt timestamp, mood, and notes
        await tx
          .update(schema.statusUpdate)
          .set({
            updatedAt: nowDate,
            mood: mood !== undefined ? mood : existingStatusUpdate.mood,
            notes: notes !== undefined ? notes : existingStatusUpdate.notes,
          })
          .where(eq(schema.statusUpdate.id, statusUpdateId));
      } else {
        // Create new status update
        statusUpdateId = generateId();

        await tx.insert(schema.statusUpdate).values({
          id: statusUpdateId,
          memberId: member.id,
          organizationId: organization.id,
          teamId: null,
          editorJson: null,
          effectiveFrom: effectiveFromStartOfDay,
          effectiveTo: effectiveToEndOfDay,
          mood: mood || null,
          emoji: null,
          notes: notes || null,
          isDraft: false,
          timezone: session.user.timezone || "UTC",
          createdAt: nowDate,
          updatedAt: nowDate,
        });
      }

      // Insert all new items
      if (items.length > 0) {
        await tx.insert(schema.statusUpdateItem).values(
          items.map((item) => ({
            id: generateId(),
            statusUpdateId,
            content: item.content,
            isBlocker: item.type === "blocker",
            isInProgress: item.type === "progress",
            order: item.order,
            createdAt: nowDate,
            updatedAt: nowDate,
          })),
        );
      }

      // Update editorJson with all items
      const nextEditorJson = {
        type: "doc",
        content: [
          {
            type: "statusUpdateHeading",
            attrs: { date: effectiveFromStartOfDay.toISOString() },
          },
          {
            type: "blockableTodoList",
            content: items.map((item) => ({
              type: "blockableTodoListItem",
              attrs: {
                checked: item.type === "done",
                blocked: item.type === "blocker",
              },
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

      // Update the status update with the new editorJson
      await tx
        .update(schema.statusUpdate)
        .set({ editorJson: nextEditorJson, updatedAt: nowDate, isDraft: false })
        .where(eq(schema.statusUpdate.id, statusUpdateId));

      // Return the complete status update with all items
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

    return {
      statusUpdate,
      message: "Status update edited successfully",
    };
  },
);

export const getCliStatusUpdateByDateHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getCliStatusUpdateByDateContract
>(
  getCliStatusUpdateByDateContract,
  requiredJwt,
  requiredActiveOrganization,
  async ({ db, organization, member, input }) => {
    const { date } = input;

    // Parse the target date
    const targetDate = dayjs.utc(date);
    const effectiveFromStartOfDay = targetDate.startOf("day").toDate();
    const effectiveToEndOfDay = targetDate.endOf("day").toDate();

    // Find status update for this member on the target date
    const statusUpdate = await db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.memberId, member.id),
        eq(schema.statusUpdate.organizationId, organization.id),
        gte(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDay),
        lte(schema.statusUpdate.effectiveTo, effectiveToEndOfDay),
      ),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
    });

    return {
      statusUpdate: statusUpdate || null,
      message: statusUpdate
        ? "Status update found for date"
        : "No status update found for the specified date",
    };
  },
);
