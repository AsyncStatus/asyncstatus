import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import * as schema from "../db/schema";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnexpectedApiError,
} from "../errors";
import type { HonoEnvWithSession } from "../lib/env";
import { requiredSession } from "../lib/middleware";

export const invitationRouter = new Hono<HonoEnvWithSession>()
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator("query", z.object({ email: z.string().email() })),
    async (c) => {
      const { id } = c.req.valid("param");
      const { email } = c.req.valid("query");
      const [invitation, user] = await Promise.all([
        c.var.db.query.invitation.findFirst({
          where: and(
            eq(schema.invitation.id, id),
            eq(schema.invitation.email, email),
          ),
          with: {
            inviter: { columns: { name: true } },
            organization: { columns: { name: true, slug: true, logo: true } },
            team: { columns: { name: true } },
          },
        }),
        c.var.db.query.user.findFirst({
          where: eq(schema.user.email, email),
        }),
      ]);
      if (
        !invitation ||
        (c.var.session && c.var.session.user.email !== invitation.email)
      ) {
        throw new AsyncStatusNotFoundError({
          message: "Invitation not found",
        });
      }
      const data = { ...invitation, hasUser: Boolean(user) };
      return c.json(data);
    },
  )
  .patch(
    "/:id/cancel",
    requiredSession,
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid("param");

      // Find the invitation
      const invitation = await c.var.db.query.invitation.findFirst({
        where: eq(schema.invitation.id, id),
        with: {
          organization: {
            with: {
              members: {
                where: eq(schema.member.userId, c.var.session.user.id),
              },
            },
          },
        },
      });

      if (!invitation) {
        throw new AsyncStatusNotFoundError({
          message: "Invitation not found",
        });
      }

      // Check if the user is the inviter or an admin/owner of the organization
      const isInviter = invitation.inviterId === c.var.session.user.id;
      const isAdminOrOwner = invitation.organization.members.some(
        (member) => member.role === "admin" || member.role === "owner",
      );

      if (!isInviter && !isAdminOrOwner) {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to cancel this invitation",
        });
      }

      // Check if the invitation is already accepted, rejected, or canceled
      if (invitation.status !== "pending") {
        throw new AsyncStatusBadRequestError({
          message: `Invitation is already ${invitation.status}`,
        });
      }

      // Update the invitation status to canceled
      const updatedInvitation = await c.var.db
        .update(schema.invitation)
        .set({ status: "canceled" })
        .where(eq(schema.invitation.id, id))
        .returning();

      if (!updatedInvitation || !updatedInvitation[0]) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to cancel invitation",
        });
      }

      return c.json(updatedInvitation[0]);
    },
  )
  .patch(
    "/:id/accept",
    requiredSession,
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid("param");

      // Find the invitation
      const invitation = await c.var.db.query.invitation.findFirst({
        where: and(
          eq(schema.invitation.id, id),
          eq(schema.invitation.email, c.var.session.user.email),
        ),
        with: {
          organization: true,
        },
      });

      if (!invitation) {
        throw new AsyncStatusNotFoundError({
          message: "Invitation not found",
        });
      }

      if (invitation.email !== c.var.session.user.email) {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to accept this invitation",
        });
      }

      // Check if the invitation is already accepted, rejected, or canceled
      if (invitation.status !== "pending") {
        throw new AsyncStatusBadRequestError({
          message: `Invitation is already ${invitation.status}`,
        });
      }

      // Check if the invitation has expired
      if (invitation.expiresAt < new Date()) {
        throw new AsyncStatusBadRequestError({
          message: "Invitation has expired",
        });
      }

      // Check if the user is already a member of the organization
      const existingMember = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.organizationId, invitation.organizationId),
          eq(schema.member.userId, c.var.session.user.id),
        ),
      });

      if (existingMember) {
        throw new AsyncStatusBadRequestError({
          message: "You are already a member of this organization",
        });
      }

      // Start a transaction to update the invitation and create a member
      const now = new Date();

      const results = await c.var.db.transaction(async (tx) => {
        // Update the invitation status to accepted
        const updatedInvitation = await tx
          .update(schema.invitation)
          .set({ status: "accepted" })
          .where(eq(schema.invitation.id, id))
          .returning();

        if (!updatedInvitation || !updatedInvitation[0]) {
          throw new AsyncStatusUnexpectedApiError({
            message: "Failed to accept invitation",
          });
        }

        // Create a member record
        const member = await tx
          .insert(schema.member)
          .values({
            id: generateId(),
            organizationId: invitation.organizationId,
            userId: c.var.session.user.id,
            role: invitation.role || "member",
            createdAt: now,
          })
          .returning();

        if (!member || !member[0]) {
          throw new AsyncStatusUnexpectedApiError({
            message: "Failed to create member",
          });
        }

        // If the invitation has a team, add the member to the team
        if (invitation.teamId) {
          await tx.insert(schema.teamMembership).values({
            id: generateId(),
            teamId: invitation.teamId,
            memberId: member[0].id,
          });
        }

        if (!c.var.session.user.emailVerified) {
          await tx
            .update(schema.user)
            .set({ emailVerified: true })
            .where(eq(schema.user.id, c.var.session.user.id));
        }

        const organization = await tx.query.organization.findFirst({
          where: eq(schema.organization.id, invitation.organizationId),
        });
        if (!organization) {
          throw new AsyncStatusNotFoundError({
            message: "Organization not found",
          });
        }

        return { organization, member: member[0] };
      });

      return c.json(results);
    },
  )
  .patch(
    "/:id/reject",
    requiredSession,
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id } = c.req.valid("param");

      // Find the invitation
      const invitation = await c.var.db.query.invitation.findFirst({
        where: and(
          eq(schema.invitation.id, id),
          eq(schema.invitation.email, c.var.session.user.email),
        ),
      });

      if (!invitation) {
        throw new AsyncStatusNotFoundError({
          message: "Invitation not found",
        });
      }

      if (invitation.email !== c.var.session.user.email) {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to reject this invitation",
        });
      }

      // Check if the invitation is already accepted, rejected, or canceled
      if (invitation.status !== "pending") {
        throw new AsyncStatusBadRequestError({
          message: `Invitation is already ${invitation.status}`,
        });
      }

      // Update the invitation status to rejected
      const updatedInvitation = await c.var.db
        .update(schema.invitation)
        .set({ status: "rejected" })
        .where(eq(schema.invitation.id, id))
        .returning();

      if (!updatedInvitation || updatedInvitation.length === 0) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to reject invitation",
        });
      }

      return c.json(updatedInvitation[0]);
    },
  );
