import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import dayjs from "dayjs";
// @ts-ignore - dayjs plugin types may not be fully compatible
import utcPlugin from "dayjs/plugin/utc.js";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { Hono } from "hono";

// Enable UTC plugin for dayjs
dayjs.extend(utcPlugin);

import * as schema from "../../db/schema";
import {
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import {
  zStatusUpdateCreate,
  zStatusUpdateId,
  zStatusUpdateIdOrDate,
  zStatusUpdateMemberSearch,
  zStatusUpdateUpdate,
} from "../../schema/statusUpdate";

export const statusUpdateRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredSession)
  .use(requiredOrganization)
  // Get all status updates for an organization
  .get("/:idOrSlug/status-update", async (c) => {
    const statusUpdates = await c.var.db.query.statusUpdate.findMany({
      where: eq(schema.statusUpdate.organizationId, c.var.organization.id),
      with: {
        member: { with: { user: true } },
        team: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });

    return c.json(statusUpdates);
  })
  // Get all status updates for a specific date
  .get("/:idOrSlug/status-update/date/:date", async (c) => {
    const { date } = c.req.param();

    // Parse and validate the date
    const targetDate = dayjs(date, "YYYY-MM-DD", true);
    if (!targetDate.isValid()) {
      throw new AsyncStatusUnexpectedApiError({
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Create date boundaries in UTC to avoid timezone issues
    const startOfDay = targetDate.utc().startOf("day").toDate();
    const endOfDay = targetDate.utc().endOf("day").toDate();

    const statusUpdates = await c.var.db.query.statusUpdate.findMany({
      where: and(
        eq(schema.statusUpdate.organizationId, c.var.organization.id),
        eq(schema.statusUpdate.isDraft, false),
        // More precise date filtering: find status updates that are effective on this specific date
        // Status update is effective on the target date if:
        // 1. It starts on or before the end of the target date, AND
        // 2. It ends on or after the start of the target date
        // This handles both single-day status updates and multi-day status updates correctly
        lte(schema.statusUpdate.effectiveFrom, endOfDay),
        gte(schema.statusUpdate.effectiveTo, startOfDay),
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

    // Additional client-side filtering to ensure we only get status updates that truly overlap with the target date
    // This is a backup check in case there are any timezone or date conversion issues
    const filteredStatusUpdates = statusUpdates.filter((update) => {
      const updateStartDate = dayjs(update.effectiveFrom).utc();
      const updateEndDate = dayjs(update.effectiveTo).utc();
      const targetDateUTC = targetDate.utc();
      
      // Check if the status update's date range includes the target date
      const startsBeforeOrOnTargetDate = updateStartDate.isSameOrBefore(targetDateUTC.endOf("day"));
      const endsAfterOrOnTargetDate = updateEndDate.isSameOrAfter(targetDateUTC.startOf("day"));
      
      return startsBeforeOrOnTargetDate && endsAfterOrOnTargetDate;
    });

    // Sort by member name after filtering
    const sortedStatusUpdates = filteredStatusUpdates.sort((a, b) =>
      a.member.user.name.localeCompare(b.member.user.name),
    );

    return c.json(sortedStatusUpdates);
  })
  // Get status updates by team
  .get("/:idOrSlug/status-update/team/:teamId", async (c) => {
    const { teamId } = c.req.param();

    // Verify team belongs to this organization
    const team = await c.var.db.query.team.findFirst({
      where: and(
        eq(schema.team.id, teamId),
        eq(schema.team.organizationId, c.var.organization.id),
      ),
    });

    if (!team) {
      throw new AsyncStatusNotFoundError({
        message: "Team not found",
      });
    }

    const statusUpdates = await c.var.db.query.statusUpdate.findMany({
      where: and(
        eq(schema.statusUpdate.organizationId, c.var.organization.id),
        eq(schema.statusUpdate.teamId, teamId),
      ),
      with: {
        member: true,
        items: {
          orderBy: (items) => [items.order],
        },
      },
      orderBy: (statusUpdates) => [desc(statusUpdates.effectiveFrom)],
    });

    return c.json(statusUpdates);
  })
  // Get status updates for a member
  .get(
    "/:idOrSlug/status-update/member/:memberId",
    zValidator("query", zStatusUpdateMemberSearch),
    async (c) => {
      const { memberId } = c.req.param();
      const { isDraft, effectiveFrom } = c.req.valid("query");

      // Verify member belongs to this organization
      const member = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.id, memberId),
          eq(schema.member.organizationId, c.var.organization.id),
        ),
      });

      if (!member) {
        throw new AsyncStatusNotFoundError({
          message: "Member not found",
        });
      }

      const where = [
        eq(schema.statusUpdate.organizationId, c.var.organization.id),
        eq(schema.statusUpdate.memberId, memberId),
      ];

      if (typeof isDraft === "boolean" && isDraft) {
        where.push(eq(schema.statusUpdate.isDraft, true));
      } else if (typeof isDraft === "boolean" && !isDraft) {
        where.push(eq(schema.statusUpdate.isDraft, false));
      }

      if (effectiveFrom) {
        where.push(
          eq(schema.statusUpdate.effectiveFrom, new Date(effectiveFrom)),
        );
      }

      const statusUpdates = await c.var.db.query.statusUpdate.findMany({
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

      return c.json(statusUpdates);
    },
  )
  // Get a single status update
  .get(
    "/:idOrSlug/status-update/:statusUpdateIdOrDate",
    zValidator("param", zStatusUpdateIdOrDate),
    async (c) => {
      const { statusUpdateIdOrDate } = c.req.valid("param");

      const isDate = dayjs(statusUpdateIdOrDate, "YYYY-MM-DD", true).isValid();
      if (isDate) {
        const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
          where: eq(
            schema.statusUpdate.effectiveFrom,
            dayjs(statusUpdateIdOrDate, "YYYY-MM-DD", true)
              .utc()
              .startOf("day")
              .toDate(),
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
          throw new AsyncStatusNotFoundError({
            message: "Status update not found",
          });
        }

        if (
          statusUpdate.organizationId !== c.var.organization.id ||
          statusUpdate.member.id !== c.var.member.id
        ) {
          throw new AsyncStatusForbiddenError({
            message: "You don't have access to this status update",
          });
        }

        return c.json(statusUpdate);
      }

      const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateIdOrDate),
        with: {
          member: { with: { user: true } },
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!statusUpdate) {
        throw new AsyncStatusNotFoundError({
          message: "Status update not found",
        });
      }

      // Verify the status update belongs to this organization
      if (statusUpdate.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this status update",
        });
      }

      return c.json(statusUpdate);
    },
  )
  // Create or update a status update (upsert based on effectiveFrom date)
  .post(
    "/:idOrSlug/status-update",
    zValidator("json", zStatusUpdateCreate),
    async (c) => {
      const {
        teamId,
        effectiveFrom,
        effectiveTo,
        mood,
        emoji,
        isDraft,
        notes,
        items,
        editorJson,
      } = c.req.valid("json");
      const memberId = c.var.member.id;

      // Verify member belongs to this organization
      const member = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.id, memberId),
          eq(schema.member.organizationId, c.var.organization.id),
        ),
      });

      if (!member) {
        throw new AsyncStatusNotFoundError({
          message: "Member not found",
        });
      }

      // If teamId is provided, verify it belongs to this organization
      if (teamId) {
        const team = await c.var.db.query.team.findFirst({
          where: and(
            eq(schema.team.id, teamId),
            eq(schema.team.organizationId, c.var.organization.id),
          ),
        });

        if (!team) {
          throw new AsyncStatusNotFoundError({
            message: "Team not found",
          });
        }
      }

      const now = new Date();

      // Check if a status update already exists for this member on the effectiveFrom date
      // Use UTC to ensure consistent date handling across timezones
      const effectiveFromStartOfDay = dayjs(effectiveFrom)
        .utc()
        .startOf("day")
        .toDate();
      
      // Also ensure effectiveTo is handled consistently
      const effectiveToEndOfDay = dayjs(effectiveTo)
        .utc()
        .endOf("day")
        .toDate();

      // Use a transaction to ensure all operations are atomic
      const statusUpdate = await c.var.db.transaction(async (tx) => {
        const existingStatusUpdate = await tx.query.statusUpdate.findFirst({
          where: and(
            eq(schema.statusUpdate.memberId, memberId),
            eq(schema.statusUpdate.organizationId, c.var.organization.id),
            eq(schema.statusUpdate.effectiveFrom, effectiveFromStartOfDay),
          ),
        });

        // Get the user's current timezone
        const user = await tx.query.user.findFirst({
          where: eq(schema.user.id, c.var.session.user.id),
        });

        const userTimezone = user?.timezone || "UTC";

        let statusUpdateId: string;

        if (existingStatusUpdate) {
          // Update existing status update
          statusUpdateId = existingStatusUpdate.id;

                      await tx
              .update(schema.statusUpdate)
              .set({
                teamId: teamId || null,
                editorJson,
                effectiveTo: effectiveToEndOfDay,
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
                memberId,
                organizationId: c.var.organization.id,
                teamId: teamId || null,
                editorJson,
                effectiveFrom: effectiveFromStartOfDay,
                effectiveTo: effectiveToEndOfDay,
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
                where: eq(
                  schema.statusUpdateItem.statusUpdateId,
                  statusUpdateId,
                ),
              })
            : [];

          // Create a set of existing item signatures for quick lookup
          const existingItemSignatures = new Set(
            existingItems.map(
              (item) =>
                `${item.content}|${item.isBlocker}|${item.isInProgress}|${item.order}`,
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
                (item) =>
                  `${item.content}|${item.isBlocker}|${item.isInProgress}|${item.order}`,
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
            member: true,
            team: true,
            items: {
              orderBy: (items) => [items.order],
            },
          },
        });

        if (!result) {
          throw new AsyncStatusUnexpectedApiError({
            message: "Failed to create or update status update",
          });
        }

        return result;
      });

      return c.json(statusUpdate);
    },
  )
  // Update a status update
  .patch(
    "/:idOrSlug/status-update/:statusUpdateId",
    zValidator("param", zStatusUpdateId),
    zValidator("json", zStatusUpdateUpdate),
    async (c) => {
      const { statusUpdateId } = c.req.valid("param");
      const updates = c.req.valid("json");

      // Get the status update to verify ownership
      const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: true,
        },
      });

      if (!statusUpdate) {
        throw new AsyncStatusNotFoundError({
          message: "Status update not found",
        });
      }

      // Verify the status update belongs to this organization
      if (statusUpdate.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this status update",
        });
      }

      // Check if user can update this status update
      const isOwner = statusUpdate.member.id === c.var.member.id;
      const isAdmin = ["admin", "owner"].includes(c.var.member.role);

      if (!isOwner && !isAdmin) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have permission to update this status update",
        });
      }

      // If teamId is provided, verify it belongs to this organization
      if (updates.teamId) {
        const team = await c.var.db.query.team.findFirst({
          where: and(
            eq(schema.team.id, updates.teamId),
            eq(schema.team.organizationId, c.var.organization.id),
          ),
        });

        if (!team) {
          throw new AsyncStatusNotFoundError({
            message: "Team not found",
          });
        }
      }

      const updatedStatusUpdate = await c.var.db
        .update(schema.statusUpdate)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.statusUpdate.id, statusUpdateId))
        .returning();

      if (!updatedStatusUpdate || !updatedStatusUpdate[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update status update",
        });
      }

      const result = await c.var.db.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: true,
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      return c.json(result);
    },
  )
  // Delete a status update
  .delete(
    "/:idOrSlug/status-update/:statusUpdateId",
    zValidator("param", zStatusUpdateId),
    async (c) => {
      const { statusUpdateId } = c.req.valid("param");

      // Get the status update to verify ownership
      const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: true,
        },
      });

      if (!statusUpdate) {
        throw new AsyncStatusNotFoundError({
          message: "Status update not found",
        });
      }

      // Verify the status update belongs to this organization
      if (statusUpdate.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this status update",
        });
      }

      // Check if user can delete this status update
      const isOwner = statusUpdate.member.id === c.var.member.id;
      const isAdmin = ["admin", "owner"].includes(c.var.member.role);

      if (!isOwner && !isAdmin) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have permission to delete this status update",
        });
      }

      // Delete the status update
      await c.var.db
        .delete(schema.statusUpdate)
        .where(eq(schema.statusUpdate.id, statusUpdateId));

      return c.json({ success: true });
    },
  );
