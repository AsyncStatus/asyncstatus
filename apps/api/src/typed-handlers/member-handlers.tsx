import OrganizationInvitationEmail from "@asyncstatus/email/organization/organization-invitation-email";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import dayjs from "dayjs";
import { and, eq, not } from "drizzle-orm";
import { invitation, member, team, user } from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import {
  getMemberContract,
  inviteMemberContract,
  listMembersContract,
  updateMemberContract,
} from "./member-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const getMemberHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getMemberContract
>(getMemberContract, requiredSession, requiredOrganization, async ({ db, input, organization }) => {
  const { memberId } = input;
  const foundMember = await db.query.member.findFirst({
    where: and(eq(member.organizationId, organization.id), eq(member.id, memberId)),
    with: { user: true, teamMemberships: { with: { team: true } } },
  });
  if (!foundMember) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Member not found",
    });
  }
  return foundMember;
});

export const listMembersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listMembersContract
>(
  listMembersContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, webAppUrl }) => {
    const [membersWithUsers, invitations] = await Promise.all([
      db.query.member.findMany({
        where: eq(member.organizationId, organization.id),
        with: { user: true },
      }),
      db.query.invitation.findMany({
        where: and(
          eq(invitation.organizationId, organization.id),
          not(eq(invitation.status, "accepted")),
          not(eq(invitation.status, "canceled")),
        ),
      }),
    ]);
    return {
      members: membersWithUsers,
      invitations: invitations.map((invitation) => ({
        ...invitation,
        link: `${webAppUrl}/invitations?invitationId=${invitation.id}&invitationEmail=${invitation.email}`,
      })),
    };
  },
);

export const updateMemberHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof updateMemberContract
>(
  updateMemberContract,
  requiredSession,
  requiredOrganization,
  async ({ db, input, session, bucket, authKv, member: currentMember }) => {
    const { idOrSlug: _idOrSlug, memberId, role, archivedAt, ...userUpdates } = input;
    const existingMember = await db.query.member.findFirst({
      where: eq(member.id, memberId),
      with: { user: true },
    });
    if (!existingMember) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }
    if (
      existingMember.userId !== currentMember.id &&
      currentMember.role !== "admin" &&
      currentMember.role !== "owner"
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to update this member",
      });
    }

    const updatedMember = await db.transaction(async (tx) => {
      if (role) {
        await tx.update(member).set({ role }).where(eq(member.id, memberId));
      }
      if (archivedAt) {
        await tx
          .update(member)
          .set({ archivedAt: archivedAt as Date })
          .where(eq(member.id, memberId));
      } else if (archivedAt === null && member.archivedAt) {
        await tx.update(member).set({ archivedAt: null }).where(eq(member.id, memberId));
      }

      if (userUpdates.image instanceof File) {
        const image = await bucket.private.put(generateId(), userUpdates.image);
        if (!image) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload image",
          });
        }
        (userUpdates.image as any) = image.key;
      } else if (userUpdates.image === null && existingMember.user.image) {
        await bucket.private.delete(existingMember.user.image);
        (userUpdates.image as any) = null;
      }
      if (Object.keys(userUpdates).length > 0) {
        const name =
          userUpdates.firstName || userUpdates.lastName
            ? `${userUpdates.firstName} ${userUpdates.lastName}`
            : undefined;

        await tx
          .update(user)
          .set({ name, ...(userUpdates as any) })
          .where(eq(user.id, existingMember.userId));
      }
      const updatedMember = await tx.query.member.findFirst({
        where: eq(member.id, memberId),
        with: { user: true },
      });
      if (!updatedMember) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update member",
        });
      }

      if (updatedMember.user.id === session.user.id) {
        const data = await authKv.get<any>(session.session.token, {
          type: "json",
        });
        if (!data) {
          throw new TypedHandlersError({
            code: "UNAUTHORIZED",
            message: "Unauthorized",
          });
        }
        await authKv.put(
          session.session.token,
          JSON.stringify({
            ...data,
            user: { ...data.user, ...updatedMember.user },
          }),
        );
      }

      return updatedMember;
    });

    return updatedMember;
  },
);

export const inviteMemberHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof inviteMemberContract
>(
  inviteMemberContract,
  requiredSession,
  requiredOrganization,
  async ({ db, input, resend, organization, member: currentMember, session, webAppUrl }) => {
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to invite members",
      });
    }

    const { firstName, lastName, email, role, teamId } = input;
    let [existingInvitation, existingUser] = await Promise.all([
      db.query.invitation.findFirst({
        where: and(eq(invitation.organizationId, organization.id), eq(invitation.email, email)),
      }),
      db.query.member.findFirst({
        where: and(
          eq(member.organizationId, organization.id),
          eq(member.userId, db.select({ id: user.id }).from(user).where(eq(user.email, email))),
        ),
        with: { user: true },
      }),
    ]);
    if (existingUser?.archivedAt) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "User is archived",
      });
    }
    if (
      (existingInvitation?.expiresAt && existingInvitation.expiresAt < new Date()) ||
      existingInvitation?.status === "canceled" ||
      existingInvitation?.status === "rejected"
    ) {
      await db.delete(invitation).where(eq(invitation.id, existingInvitation.id));
      existingInvitation = undefined;
      existingUser = undefined;
    }
    if (existingInvitation || existingUser?.user) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "User already a member or has an invitation",
      });
    }

    let firstTeamId: string | undefined;
    if (teamId) {
      const foundTeam = await db.query.team.findFirst({
        where: eq(team.id, teamId),
      });
      if (!foundTeam) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "Team not found",
        });
      }
      firstTeamId = foundTeam.id;
    } else {
      const foundTeam = await db.query.team.findFirst({
        where: eq(team.organizationId, organization.id),
      });
      if (!foundTeam) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No teams found",
        });
      }
      firstTeamId = foundTeam.id;
    }

    const invitationId = generateId();
    await db.insert(invitation).values({
      id: invitationId,
      name: `${firstName} ${lastName}`,
      expiresAt: dayjs().add(48, "hours").toDate(),
      email,
      role,
      organizationId: organization.id,
      inviterId: session.user.id,
      status: "pending",
      teamId: firstTeamId,
    });
    const newInvitation = await db.query.invitation.findFirst({
      where: eq(invitation.id, invitationId),
      with: { inviter: true, organization: true },
    });
    if (!newInvitation) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create invitation",
      });
    }

    const params = new URLSearchParams();
    params.set("invitationId", newInvitation.id);
    params.set("invitationEmail", email);
    const inviteLink = `${webAppUrl}/invitations?${params.toString()}`;
    const invitedByUsername =
      newInvitation.inviter.name?.split(" ")[0] ?? newInvitation.inviter.name;

    await resend.emails.send({
      from: "AsyncStatus <onboarding@a.asyncstatus.com>",
      to: newInvitation.email,
      subject: `${invitedByUsername} invited you to ${newInvitation.organization.name}`,
      text: `${invitedByUsername} invited you to ${newInvitation.organization.name}, accept invitation before it expires.`,
      react: (
        <OrganizationInvitationEmail
          inviteeFirstName={firstName}
          invitedByUsername={invitedByUsername}
          invitedByEmail={newInvitation.inviter.email}
          teamName={newInvitation.organization.name}
          inviteLink={inviteLink}
          expiration="48 hours"
          preview={`${invitedByUsername} invited you to ${newInvitation.organization.name}, accept invitation before it expires.`}
        />
      ),
    });

    return newInvitation;
  },
);
