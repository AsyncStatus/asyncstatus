import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { member, user } from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getMemberContract, updateMemberContract } from "./member-contracts";
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
