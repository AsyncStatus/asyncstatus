import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";

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
  zStatusUpdateItemCreate,
  zStatusUpdateItemId,
  zStatusUpdateItemUpdate,
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
  .get("/:idOrSlug/status-update/member/:memberId", async (c) => {
    const { memberId } = c.req.param();

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

    const statusUpdates = await c.var.db.query.statusUpdate.findMany({
      where: and(
        eq(schema.statusUpdate.organizationId, c.var.organization.id),
        eq(schema.statusUpdate.memberId, memberId),
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

    return c.json(statusUpdates);
  })
  // Get a single status update
  .get(
    "/:idOrSlug/status-update/:statusUpdateId",
    zValidator("param", zStatusUpdateId),
    async (c) => {
      const { statusUpdateId } = c.req.valid("param");

      const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
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
  // Create a new status update
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
      const statusUpdateId = generateId();

      const statusUpdateResult = await c.var.db
        .insert(schema.statusUpdate)
        .values({
          id: statusUpdateId,
          memberId,
          organizationId: c.var.organization.id,
          teamId: teamId || null,
          effectiveFrom,
          effectiveTo,
          mood,
          emoji,
          notes,
          isDraft,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      console.log(statusUpdateResult);

      if (items) {
        await c.var.db.insert(schema.statusUpdateItem).values(
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

      const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
        where: eq(schema.statusUpdate.id, statusUpdateId),
        with: {
          member: true,
          team: true,
          items: {
            orderBy: (items) => [items.order],
          },
        },
      });

      if (!statusUpdate) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create status update",
        });
      }

      // const statusUpdate = await c.var.db.transaction(async (tx) => {
      //   const now = new Date();
      //   const statusUpdateId = generateId();

      //   console.log(statusUpdateId);

      //   await tx.insert(schema.statusUpdate).values({
      //     id: statusUpdateId,
      //     memberId,
      //     organizationId: c.var.organization.id,
      //     teamId,
      //     effectiveFrom,
      //     effectiveTo,
      //     mood,
      //     emoji,
      //     notes,
      //     isDraft,
      //     createdAt: now,
      //     updatedAt: now,
      //   });

      //   if (items) {
      //     await tx.insert(schema.statusUpdateItem).values(
      //       items.map((item) => ({
      //         id: generateId(),
      //         statusUpdateId,
      //         content: item.content,
      //         isBlocker: item.isBlocker,
      //         isInProgress: item.isInProgress,
      //         order: item.order,
      //         createdAt: now,
      //         updatedAt: now,
      //       })),
      //     );
      //   }

      //   const result = await tx.query.statusUpdate.findFirst({
      //     where: eq(schema.statusUpdate.id, statusUpdateId),
      //     with: {
      //       member: true,
      //       team: true,
      //       items: {
      //         orderBy: (items) => [items.order],
      //       },
      //     },
      //   });

      //   if (!result) {
      //     throw new AsyncStatusUnexpectedApiError({
      //       message: "Failed to create status update",
      //     });
      //   }

      //   return result;
      // });

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
