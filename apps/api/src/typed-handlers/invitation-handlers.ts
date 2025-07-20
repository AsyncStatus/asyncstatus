import { TypedHandlersError, typedHandler, typedMiddleware } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContext, TypedHandlersContextWithSession } from "../lib/env";
import {
  acceptInvitationContract,
  cancelInvitationContract,
  getInvitationContract,
  listUserInvitationsContract,
  rejectInvitationContract,
} from "./invitation-contracts";
import { requiredSession } from "./middleware";

export const getInvitationHandler = typedHandler<
  TypedHandlersContext,
  typeof getInvitationContract
>(
  getInvitationContract,
  typedMiddleware<TypedHandlersContext>(async ({ rateLimiter }, next) =>
    rateLimiter.invitation(next),
  ),
  async ({ db, input, session }) => {
    const { id, email } = input;

    const [invitation, user] = await Promise.all([
      db.query.invitation.findFirst({
        where: and(eq(schema.invitation.id, id), eq(schema.invitation.email, email)),
        with: {
          inviter: { columns: { name: true } },
          organization: { columns: { name: true, slug: true, logo: true } },
          team: { columns: { name: true } },
        },
      }),
      db.query.user.findFirst({
        where: eq(schema.user.email, email),
      }),
    ]);

    if (!invitation || (session && session.user.email !== invitation.email)) {
      throw new TypedHandlersError({
        message: "Invitation not found",
        code: "NOT_FOUND",
      });
    }

    return {
      ...invitation,
      hasUser: Boolean(user),
    };
  },
);

export const listUserInvitationsHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof listUserInvitationsContract
>(listUserInvitationsContract, requiredSession, async ({ db, session }) => {
  return await db.query.invitation.findMany({
    where: and(
      eq(schema.invitation.email, session.user.email),
      eq(schema.invitation.status, "pending"),
    ),
    with: {
      organization: { columns: { name: true, slug: true, logo: true } },
      team: { columns: { name: true } },
      inviter: { columns: { name: true } },
    },
  });
});

export const cancelInvitationHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof cancelInvitationContract
>(cancelInvitationContract, requiredSession, async ({ db, input, session }) => {
  const { id } = input;

  const invitation = await db.query.invitation.findFirst({
    where: eq(schema.invitation.id, id),
    with: {
      organization: { with: { members: { where: eq(schema.member.userId, session.user.id) } } },
    },
  });

  if (!invitation) {
    throw new TypedHandlersError({
      message: "Invitation not found",
      code: "NOT_FOUND",
    });
  }

  // Check if the user is the inviter or an admin/owner of the organization
  const isInviter = invitation.inviterId === session.user.id;
  const isAdminOrOwner = invitation.organization.members.some(
    (member) => member.role === "admin" || member.role === "owner",
  );

  if (!isInviter && !isAdminOrOwner) {
    throw new TypedHandlersError({
      message: "You do not have permission to cancel this invitation",
      code: "FORBIDDEN",
    });
  }

  // Check if the invitation is already accepted, rejected, or canceled
  if (invitation.status !== "pending") {
    throw new TypedHandlersError({
      message: `Invitation is already ${invitation.status}`,
      code: "BAD_REQUEST",
    });
  }

  const updatedInvitation = await db
    .update(schema.invitation)
    .set({ status: "canceled" })
    .where(eq(schema.invitation.id, id))
    .returning();

  if (!updatedInvitation || !updatedInvitation[0]) {
    throw new TypedHandlersError({
      message: "Failed to cancel invitation",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return updatedInvitation[0];
});

export const acceptInvitationHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof acceptInvitationContract
>(acceptInvitationContract, requiredSession, async ({ db, input, session }) => {
  const { id } = input;

  // Find the invitation
  const invitation = await db.query.invitation.findFirst({
    where: and(eq(schema.invitation.id, id), eq(schema.invitation.email, session.user.email)),
    with: {
      organization: true,
    },
  });

  if (!invitation) {
    throw new TypedHandlersError({
      message: "Invitation not found",
      code: "NOT_FOUND",
    });
  }

  if (invitation.email !== session.user.email) {
    throw new TypedHandlersError({
      message: "You do not have permission to accept this invitation",
      code: "FORBIDDEN",
    });
  }

  // Check if the invitation is already accepted, rejected, or canceled
  if (invitation.status !== "pending") {
    throw new TypedHandlersError({
      message: `Invitation is already ${invitation.status}`,
      code: "BAD_REQUEST",
    });
  }

  // Check if the invitation has expired
  if (invitation.expiresAt < new Date()) {
    throw new TypedHandlersError({
      message: "Invitation has expired",
      code: "BAD_REQUEST",
    });
  }

  // Check if the user is already a member of the organization
  const existingMember = await db.query.member.findFirst({
    where: and(
      eq(schema.member.organizationId, invitation.organizationId),
      eq(schema.member.userId, session.user.id),
    ),
  });

  if (existingMember) {
    throw new TypedHandlersError({
      message: "You are already a member of this organization",
      code: "BAD_REQUEST",
    });
  }

  // Start a transaction to update the invitation and create a member
  const now = new Date();

  const results = await db.transaction(async (tx) => {
    // Update the invitation status to accepted
    const updatedInvitation = await tx
      .update(schema.invitation)
      .set({ status: "accepted" })
      .where(eq(schema.invitation.id, id))
      .returning();

    if (!updatedInvitation || !updatedInvitation[0]) {
      throw new TypedHandlersError({
        message: "Failed to accept invitation",
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    // Create a member record
    const member = await tx
      .insert(schema.member)
      .values({
        id: generateId(),
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: invitation.role as "owner" | "admin" | "member",
        createdAt: now,
      })
      .returning();

    if (!member || !member[0]) {
      throw new TypedHandlersError({
        message: "Failed to create member",
        code: "INTERNAL_SERVER_ERROR",
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

    if (!session.user.emailVerified) {
      await tx
        .update(schema.user)
        .set({ emailVerified: true })
        .where(eq(schema.user.id, session.user.id));
    }

    const organization = await tx.query.organization.findFirst({
      where: eq(schema.organization.id, invitation.organizationId),
    });
    if (!organization) {
      throw new TypedHandlersError({
        message: "Organization not found",
        code: "NOT_FOUND",
      });
    }

    await tx
      .update(schema.user)
      .set({ activeOrganizationSlug: organization.slug })
      .where(eq(schema.user.id, session.user.id));

    return { organization, member: member[0] };
  });

  return results;
});

export const rejectInvitationHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof rejectInvitationContract
>(rejectInvitationContract, requiredSession, async ({ db, input, session }) => {
  const { id } = input;

  const invitation = await db.query.invitation.findFirst({
    where: and(eq(schema.invitation.id, id), eq(schema.invitation.email, session.user.email)),
  });

  if (!invitation) {
    throw new TypedHandlersError({
      message: "Invitation not found",
      code: "NOT_FOUND",
    });
  }

  if (invitation.email !== session.user.email) {
    throw new TypedHandlersError({
      message: "You do not have permission to reject this invitation",
      code: "FORBIDDEN",
    });
  }

  // Check if the invitation is already accepted, rejected, or canceled
  if (invitation.status !== "pending") {
    throw new TypedHandlersError({
      message: `Invitation is already ${invitation.status}`,
      code: "BAD_REQUEST",
    });
  }

  const updatedInvitation = await db
    .update(schema.invitation)
    .set({ status: "rejected" })
    .where(eq(schema.invitation.id, id))
    .returning();

  if (!updatedInvitation || !updatedInvitation[0]) {
    throw new TypedHandlersError({
      message: "Failed to reject invitation",
      code: "INTERNAL_SERVER_ERROR",
    });
  }

  return updatedInvitation[0];
});
