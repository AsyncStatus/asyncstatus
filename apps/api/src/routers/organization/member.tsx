import OrganizationInvitationEmail from "@asyncstatus/email/organization/organization-invitation-email";
import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import dayjs from "dayjs";
import { and, eq, not } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../../db";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
  AsyncStatusUnauthorizedError,
  AsyncStatusUnexpectedApiError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import {
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
  zOrganizationMemberId,
  zOrganizationMemberUpdate,
  zUserTimezoneUpdate,
} from "../../schema/organization";

export const memberRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredOrganization)
  .use(requiredSession)
  .get(
    "/:idOrSlug/members",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const [membersWithUsers, invitations] = await Promise.all([
        c.var.db.query.member.findMany({
          where: eq(schema.member.organizationId, c.var.organization.id),
          with: { user: true },
        }),
        c.var.db.query.invitation.findMany({
          where: and(
            eq(schema.invitation.organizationId, c.var.organization.id),
            not(eq(schema.invitation.status, "accepted")),
            not(eq(schema.invitation.status, "canceled")),
          ),
        }),
      ]);
      return c.json({ members: membersWithUsers, invitations });
    },
  )
  .get(
    "/:idOrSlug/members/:memberId",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug.and(zOrganizationMemberId)),
    async (c) => {
      const { memberId } = c.req.valid("param");

      const member = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.organizationId, c.var.organization.id),
          eq(schema.member.id, memberId),
        ),
        with: { user: true, teamMemberships: { with: { team: true } } },
      });
      if (!member) {
        throw new AsyncStatusNotFoundError({ message: "Member not found" });
      }

      return c.json(member);
    },
  )
  .patch(
    "/:idOrSlug/members/:memberId",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug.and(zOrganizationMemberId)),
    zValidator("form", zOrganizationMemberUpdate),
    async (c) => {
      const { memberId } = c.req.valid("param");
      const member = await c.var.db.query.member.findFirst({
        where: eq(schema.member.id, memberId),
        with: { user: true },
      });
      if (!member) {
        throw new AsyncStatusNotFoundError({ message: "Member not found" });
      }
      if (
        member.userId !== c.var.session.user.id &&
        c.var.member.role !== "admin" &&
        c.var.member.role !== "owner"
      ) {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to update this member",
        });
      }

      const { role, archivedAt, slackUsername, ...userUpdates } = c.req.valid("form");
      const updatedMember = await c.var.db.transaction(async (tx) => {
        if (role) {
          await tx.update(schema.member).set({ role }).where(eq(schema.member.id, memberId));
        }
        if (archivedAt) {
          await tx
            .update(schema.member)
            .set({ archivedAt: new Date(archivedAt) })
            .where(eq(schema.member.id, memberId));
        } else if (archivedAt === null && member.archivedAt) {
          await tx
            .update(schema.member)
            .set({ archivedAt: null })
            .where(eq(schema.member.id, memberId));
        }

        if (slackUsername !== undefined) {
          await tx
            .update(schema.member)
            .set({ slackUsername })
            .where(eq(schema.member.id, memberId));
        }

        if (userUpdates.image instanceof File) {
          const image = await c.env.PRIVATE_BUCKET.put(generateId(), userUpdates.image);
          if (!image) {
            throw new AsyncStatusUnexpectedApiError({
              message: "Failed to upload image",
            });
          }
          (userUpdates.image as any) = image.key;
        } else if (userUpdates.image === null && member.user.image) {
          await c.env.PRIVATE_BUCKET.delete(member.user.image);
          (userUpdates.image as any) = null;
        }
        if (Object.keys(userUpdates).length > 0) {
          const name =
            userUpdates.firstName || userUpdates.lastName
              ? `${userUpdates.firstName} ${userUpdates.lastName}`
              : undefined;

          await tx
            .update(schema.user)
            .set({ name, ...(userUpdates as any) })
            .where(eq(schema.user.id, member.userId));
        }
        const updatedMember = await tx.query.member.findFirst({
          where: eq(schema.member.id, memberId),
          with: { user: true },
        });
        if (!updatedMember) {
          throw new AsyncStatusUnexpectedApiError({
            message: "Failed to update member",
          });
        }
        return updatedMember;
      });

      return c.json(updatedMember);
    },
  )
  .post(
    "/:idOrSlug/members/invitations",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("json", zOrganizationCreateInvite),
    async (c) => {
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusForbiddenError({
          message: "You do not have permission to invite members",
        });
      }

      const { firstName, lastName, email, role, teamId } = c.req.valid("json");
      let [existingInvitation, existingUser] = await Promise.all([
        c.var.db.query.invitation.findFirst({
          where: and(
            eq(schema.invitation.organizationId, c.var.organization.id),
            eq(schema.invitation.email, email),
          ),
        }),
        c.var.db.query.member.findFirst({
          where: and(
            eq(schema.member.organizationId, c.var.organization.id),
            eq(
              schema.member.userId,
              c.var.db
                .select({ id: schema.user.id })
                .from(schema.user)
                .where(eq(schema.user.email, email)),
            ),
          ),
          with: { user: true },
        }),
      ]);
      if (existingUser?.archivedAt) {
        throw new AsyncStatusBadRequestError({
          message: "User is archived",
        });
      }
      if (
        (existingInvitation?.expiresAt && existingInvitation.expiresAt < new Date()) ||
        existingInvitation?.status === "canceled" ||
        existingInvitation?.status === "rejected"
      ) {
        await c.var.db
          .delete(schema.invitation)
          .where(eq(schema.invitation.id, existingInvitation.id));
        existingInvitation = undefined;
        existingUser = undefined;
      }
      if (existingInvitation || existingUser?.user) {
        throw new AsyncStatusBadRequestError({
          message: "User already a member or has an invitation",
        });
      }

      const firstTeamId =
        teamId ??
        (
          await c.var.db.query.team.findFirst({
            where: eq(schema.team.organizationId, c.var.organization.id),
          })
        )?.id;
      if (!firstTeamId) {
        throw new AsyncStatusUnexpectedApiError({
          message: "No teams found",
        });
      }

      const invitationId = generateId();
      await c.var.db.insert(schema.invitation).values({
        id: invitationId,
        name: `${firstName} ${lastName}`,
        expiresAt: dayjs().add(48, "hours").toDate(),
        email,
        role,
        organizationId: c.var.organization.id,
        inviterId: c.var.session.user.id,
        status: "pending",
        teamId: firstTeamId,
      });
      const invitation = await c.var.db.query.invitation.findFirst({
        where: eq(schema.invitation.id, invitationId),
        with: { inviter: true, organization: true },
      });
      if (!invitation) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to create invitation",
        });
      }

      const params = new URLSearchParams();
      params.set("invitationId", invitation.id);
      params.set("invitationEmail", email);
      const inviteLink = `${c.env.WEB_APP_URL}/invitation?${params.toString()}`;
      const invitedByUsername = invitation.inviter.name?.split(" ")[0] ?? invitation.inviter.name;

      await c.var.resend.emails.send({
        from: "AsyncStatus <onboarding@a.asyncstatus.com>",
        to: invitation.email,
        subject: `${invitedByUsername} invited you to ${invitation.organization.name}`,
        text: `${invitedByUsername} invited you to ${invitation.organization.name}, accept invitation before it expires.`,
        react: (
          <OrganizationInvitationEmail
            inviteeFirstName={firstName}
            invitedByUsername={invitedByUsername}
            invitedByEmail={invitation.inviter.email}
            teamName={invitation.organization.name}
            inviteLink={inviteLink}
            expiration="48 hours"
            preview={`${invitedByUsername} invited you to ${invitation.organization.name}, accept invitation before it expires.`}
          />
        ),
      });

      return c.json(invitation);
    },
  )
  .patch(
    "/:idOrSlug/members/me/timezone",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("json", zUserTimezoneUpdate),
    async (c) => {
      const { timezone } = c.req.valid("json");

      // Update timezone in a transaction to ensure atomicity
      const result = await c.var.db.transaction(async (tx) => {
        // Update the user's timezone
        await tx
          .update(schema.user)
          .set({
            timezone,
            updatedAt: new Date(),
          })
          .where(eq(schema.user.id, c.var.session.user.id));

        // Insert a record in timezone history for atomic tracking
        await tx.insert(schema.userTimezoneHistory).values({
          id: generateId(),
          userId: c.var.session.user.id,
          timezone,
          createdAt: new Date(),
        });

        // Get the updated user
        const updatedUser = await tx.query.user.findFirst({
          where: eq(schema.user.id, c.var.session.user.id),
        });

        return updatedUser;
      });

      if (!result) {
        throw new AsyncStatusUnexpectedApiError({
          message: "Failed to update timezone",
        });
      }

      const data = await c.env.AS_PROD_AUTH_KV.get<any>(c.var.session.session.token, {
        type: "json",
      });
      if (!data) {
        throw new AsyncStatusUnauthorizedError({
          message: "Unauthorized",
        });
      }
      await c.env.AS_PROD_AUTH_KV.put(
        c.var.session.session.token,
        JSON.stringify({
          ...data,
          user: { ...data.user, timezone: result.timezone },
        }),
      );

      return c.json(result);
    },
  )
  .get(
    "/:idOrSlug/members/me",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      // Return the currently logged-in user's member record
      return c.json(c.var.member);
    },
  );
