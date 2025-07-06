import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { generate } from "random-words";
import { z } from "zod/v4";

import * as schema from "../../db";
import {
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";

const zPublicShareCreate = z.object({
  statusUpdateId: z.string().min(1),
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional(),
});

const zPublicShareUpdate = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.date().optional(),
});

const zPublicShareId = z.object({
  publicShareId: z.string().min(1),
});

export const publicShareRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredSession)
  .use(requiredOrganization)
  // Create a new public share
  .post("/:idOrSlug/public-share", zValidator("json", zPublicShareCreate), async (c) => {
    const { statusUpdateId, isActive, expiresAt } = c.req.valid("json");

    // Verify status update exists and belongs to this organization
    const statusUpdate = await c.var.db.query.statusUpdate.findFirst({
      where: and(
        eq(schema.statusUpdate.id, statusUpdateId),
        eq(schema.statusUpdate.organizationId, c.var.organization.id),
      ),
      with: {
        member: true,
      },
    });

    if (!statusUpdate) {
      throw new AsyncStatusNotFoundError({
        message: "Status update not found",
      });
    }

    // Check if user can create a public share for this status update
    const isOwner = statusUpdate.member.id === c.var.member.id;
    const isAdmin = ["admin", "owner"].includes(c.var.member.role);

    if (!isOwner && !isAdmin) {
      throw new AsyncStatusForbiddenError({
        message: "You don't have permission to share this status update",
      });
    }

    // Check if status update is not a draft
    if (statusUpdate.isDraft) {
      throw new AsyncStatusForbiddenError({
        message: "Cannot share a draft status update",
      });
    }

    // Generate a unique random slug
    const randomWords = generate(2);
    const uniqueId = generateId().slice(0, 4);
    const slug = `${randomWords[0]}-${randomWords[1]}-${uniqueId}`;

    const now = new Date();
    const publicShareId = generateId();

    // Create the public share
    const publicShare = await c.var.db
      .insert(schema.publicStatusShare)
      .values({
        id: publicShareId,
        statusUpdateId,
        organizationId: c.var.organization.id,
        slug,
        isActive,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!publicShare || !publicShare[0]) {
      throw new AsyncStatusUnexpectedApiError({
        message: "Failed to create public share",
      });
    }

    return c.json(publicShare[0]);
  })
  // Get all public shares for an organization
  .get("/:idOrSlug/public-share", async (c) => {
    const publicShares = await c.var.db.query.publicStatusShare.findMany({
      where: eq(schema.publicStatusShare.organizationId, c.var.organization.id),
      with: {
        statusUpdate: { with: { member: { with: { user: true } } } },
      },
      orderBy: (publicShares) => [publicShares.createdAt],
    });

    return c.json(publicShares);
  })
  // Get a specific public share
  .get("/:idOrSlug/public-share/:publicShareId", zValidator("param", zPublicShareId), async (c) => {
    const { publicShareId } = c.req.valid("param");

    const publicShare = await c.var.db.query.publicStatusShare.findFirst({
      where: and(
        eq(schema.publicStatusShare.id, publicShareId),
        eq(schema.publicStatusShare.organizationId, c.var.organization.id),
      ),
      with: {
        statusUpdate: {
          with: {
            member: {
              with: {
                user: true,
              },
            },
            items: {
              orderBy: (items) => [items.order],
            },
          },
        },
      },
    });

    if (!publicShare) {
      throw new AsyncStatusNotFoundError({
        message: "Public share not found",
      });
    }

    return c.json(publicShare);
  })
  // Update a public share
  .patch(
    "/:idOrSlug/public-share/:publicShareId",
    zValidator("param", zPublicShareId),
    zValidator("json", zPublicShareUpdate),
    async (c) => {
      const { publicShareId } = c.req.valid("param");
      const updates = c.req.valid("json");

      // Get the public share to verify ownership
      const publicShare = await c.var.db.query.publicStatusShare.findFirst({
        where: and(
          eq(schema.publicStatusShare.id, publicShareId),
          eq(schema.publicStatusShare.organizationId, c.var.organization.id),
        ),
        with: {
          statusUpdate: {
            with: {
              member: true,
            },
          },
        },
      });

      if (!publicShare) {
        throw new AsyncStatusNotFoundError({
          message: "Public share not found",
        });
      }

      // Check if user can update this public share
      const isOwner = publicShare.statusUpdate.member.id === c.var.member.id;
      const isAdmin = ["admin", "owner"].includes(c.var.member.role);

      if (!isOwner && !isAdmin) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have permission to update this public share",
        });
      }

      const updatedPublicShare = await c.var.db
        .update(schema.publicStatusShare)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.publicStatusShare.id, publicShareId))
        .returning();

      if (!updatedPublicShare || !updatedPublicShare[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update public share",
        });
      }

      return c.json(updatedPublicShare[0]);
    },
  )
  // Delete a public share
  .delete(
    "/:idOrSlug/public-share/:publicShareId",
    zValidator("param", zPublicShareId),
    async (c) => {
      const { publicShareId } = c.req.valid("param");

      // Get the public share to verify ownership
      const publicShare = await c.var.db.query.publicStatusShare.findFirst({
        where: and(
          eq(schema.publicStatusShare.id, publicShareId),
          eq(schema.publicStatusShare.organizationId, c.var.organization.id),
        ),
        with: {
          statusUpdate: {
            with: {
              member: true,
            },
          },
        },
      });

      if (!publicShare) {
        throw new AsyncStatusNotFoundError({
          message: "Public share not found",
        });
      }

      // Check if user can delete this public share
      const isOwner = publicShare.statusUpdate.member.id === c.var.member.id;
      const isAdmin = ["admin", "owner"].includes(c.var.member.role);

      if (!isOwner && !isAdmin) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have permission to delete this public share",
        });
      }

      // Delete the public share
      await c.var.db
        .delete(schema.publicStatusShare)
        .where(eq(schema.publicStatusShare.id, publicShareId));

      return c.json({ success: true });
    },
  );
