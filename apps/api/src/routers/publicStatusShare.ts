import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import * as schema from "../db/schema";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../errors";
import type { HonoEnv, HonoEnvWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "../lib/middleware";
import {
  zPublicStatusShareCreate,
  zPublicStatusShareId,
  zPublicStatusShareSlug,
  zPublicStatusShareUpdate,
} from "../schema/statusUpdate";

// Public route that doesn't require authentication
export const publicStatusShareRouter = new Hono<HonoEnv>().get(
  "/status/:slug",
  zValidator("param", zPublicStatusShareSlug),
  async (c) => {
    const { slug } = c.req.valid("param");

    // Get the public share by slug
    const share = await c.var.db.query.publicStatusShare.findFirst({
      where: eq(schema.publicStatusShare.slug, slug),
      with: {
        statusUpdate: {
          with: {
            member: {
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
            team: true,
            items: {
              orderBy: (items) => [items.order],
            },
          },
        },
        organization: {
          columns: {
            id: true,
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });

    if (!share) {
      throw new AsyncStatusNotFoundError({
        message: "Shared status update not found",
      });
    }

    // Check if share is active
    if (!share.isActive) {
      throw new AsyncStatusForbiddenError({
        message: "This shared status update is no longer available",
      });
    }

    // Check if share has expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      throw new AsyncStatusForbiddenError({
        message: "This shared status update has expired",
      });
    }

    // Return the status update without sensitive information
    return c.json({
      statusUpdate: {
        id: share.statusUpdate.id,
        mood: share.statusUpdate.mood,
        emoji: share.statusUpdate.emoji,
        effectiveFrom: share.statusUpdate.effectiveFrom,
        effectiveTo: share.statusUpdate.effectiveTo,
        items: share.statusUpdate.items,
        member: {
          name: share.statusUpdate.member.user.name,
          image: share.statusUpdate.member.user.image,
        },
        team: share.statusUpdate.team
          ? {
              name: share.statusUpdate.team.name,
            }
          : null,
      },
      organization: {
        name: share.organization.name,
        logo: share.organization.logo,
      },
      share: {
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
      },
    });
  },
);

// Protected routes for managing public shares
export const protectedShareRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredSession)
  .use(requiredOrganization)
  // Get all public shares for an organization
  .get("/", async (c) => {
    const shares = await c.var.db.query.publicStatusShare.findMany({
      where: eq(schema.publicStatusShare.organizationId, c.var.organization.id),
      with: {
        statusUpdate: {
          with: {
            member: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    return c.json(shares);
  })
  // Get public shares for a specific status update
  .get(
    "/status-update/:statusUpdateId",
    zValidator("param", z.object({ statusUpdateId: z.string().min(1) })),
    async (c) => {
      const { statusUpdateId } = c.req.valid("param");

      // Check if status update exists and belongs to organization
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

      if (statusUpdate.member.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this status update",
        });
      }

      const shares = await c.var.db.query.publicStatusShare.findMany({
        where: eq(schema.publicStatusShare.statusUpdateId, statusUpdateId),
      });

      return c.json(shares);
    },
  )
  // Get a single public share
  .get(
    "/:publicShareId",
    zValidator("param", zPublicStatusShareId),
    async (c) => {
      const { publicShareId } = c.req.valid("param");

      const share = await c.var.db.query.publicStatusShare.findFirst({
        where: eq(schema.publicStatusShare.id, publicShareId),
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

      if (!share) {
        throw new AsyncStatusNotFoundError({
          message: "Public share not found",
        });
      }

      // Verify the share belongs to this organization
      if (share.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this public share",
        });
      }

      return c.json(share);
    },
  )
  // Create a new public share
  .post("/", zValidator("json", zPublicStatusShareCreate), async (c) => {
    const { statusUpdateId, slug, isActive, expiresAt } = c.req.valid("json");

    // Check if status update exists and belongs to organization
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

    if (statusUpdate.member.organizationId !== c.var.organization.id) {
      throw new AsyncStatusForbiddenError({
        message: "You don't have access to this status update",
      });
    }

    // Check if slug is already in use
    const existingSlug = await c.var.db.query.publicStatusShare.findFirst({
      where: eq(schema.publicStatusShare.slug, slug),
    });

    if (existingSlug) {
      throw new AsyncStatusBadRequestError({
        message: "This slug is already in use. Please choose a different one.",
      });
    }

    const now = new Date();
    const shareId = generateId();

    // Create the public share
    const share = await c.var.db
      .insert(schema.publicStatusShare)
      .values({
        id: shareId,
        statusUpdateId,
        organizationId: c.var.organization.id,
        slug,
        isActive: isActive ?? true,
        expiresAt: expiresAt || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!share || !share[0]) {
      throw new AsyncStatusUnexpectedApiError({
        message: "Failed to create public share",
      });
    }

    const result = await c.var.db.query.publicStatusShare.findFirst({
      where: eq(schema.publicStatusShare.id, shareId),
      with: {
        statusUpdate: true,
      },
    });

    return c.json(result);
  })
  // Update a public share
  .patch(
    "/:publicShareId",
    zValidator("param", zPublicStatusShareId),
    zValidator("json", zPublicStatusShareUpdate),
    async (c) => {
      const { publicShareId } = c.req.valid("param");
      const updates = c.req.valid("json");

      // Check if public share exists and belongs to organization
      const share = await c.var.db.query.publicStatusShare.findFirst({
        where: eq(schema.publicStatusShare.id, publicShareId),
      });

      if (!share) {
        throw new AsyncStatusNotFoundError({
          message: "Public share not found",
        });
      }

      if (share.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this public share",
        });
      }

      // If slug is being updated, check if it's already in use
      if (updates.slug && updates.slug !== share.slug) {
        const existingSlug = await c.var.db.query.publicStatusShare.findFirst({
          where: eq(schema.publicStatusShare.slug, updates.slug),
        });

        if (existingSlug) {
          throw new AsyncStatusBadRequestError({
            message:
              "This slug is already in use. Please choose a different one.",
          });
        }
      }

      const updatedShare = await c.var.db
        .update(schema.publicStatusShare)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(schema.publicStatusShare.id, publicShareId))
        .returning();

      if (!updatedShare || !updatedShare[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update public share",
        });
      }

      return c.json(updatedShare[0]);
    },
  )
  // Delete a public share
  .delete(
    "/:publicShareId",
    zValidator("param", zPublicStatusShareId),
    async (c) => {
      const { publicShareId } = c.req.valid("param");

      // Check if public share exists and belongs to organization
      const share = await c.var.db.query.publicStatusShare.findFirst({
        where: eq(schema.publicStatusShare.id, publicShareId),
      });

      if (!share) {
        throw new AsyncStatusNotFoundError({
          message: "Public share not found",
        });
      }

      if (share.organizationId !== c.var.organization.id) {
        throw new AsyncStatusForbiddenError({
          message: "You don't have access to this public share",
        });
      }

      // Delete the public share
      await c.var.db
        .delete(schema.publicStatusShare)
        .where(eq(schema.publicStatusShare.id, publicShareId));

      return c.json({ success: true });
    },
  );
