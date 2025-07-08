import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { desc, eq } from "drizzle-orm";
import { member, organization, team, teamMembership } from "../db";
import type { Session } from "../lib/auth";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  createOrganizationContract,
  getOrganizationContract,
  listMemberOrganizationsContract,
  setActiveOrganizationContract,
  updateOrganizationContract,
} from "./organization-contracts";

export const listMemberOrganizationsHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof listMemberOrganizationsContract
>(listMemberOrganizationsContract, requiredSession, async ({ db, session }) => {
  return await db.query.organization.findMany({
    with: { members: { where: eq(member.userId, session.user.id) } },
    orderBy: [desc(organization.createdAt)],
  });
});

export const getOrganizationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getOrganizationContract
>(
  getOrganizationContract,
  requiredSession,
  requiredOrganization,
  async ({ organization, member }) => {
    return { organization, member };
  },
);

export const setActiveOrganizationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof setActiveOrganizationContract
>(
  setActiveOrganizationContract,
  requiredSession,
  requiredOrganization,
  async ({ session, authKv, organization }) => {
    const data = await authKv.get<Session>(session.session.token, {
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
        session: {
          ...data.session,
          activeOrganizationId: organization.id,
        },
      }),
    );

    return organization;
  },
);
export const createOrganizationHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof createOrganizationContract
>(createOrganizationContract, requiredSession, async ({ db, input, session, bucket }) => {
  const { name, slug, logo } = input;

  const existingOrganization = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (existingOrganization) {
    throw new TypedHandlersError({
      code: "BAD_REQUEST",
      message: "Organization with this slug already exists",
    });
  }

  const organizationId = generateId();
  let logoKey = null;

  if (logo instanceof File) {
    const image = await bucket.private.put(generateId(), logo);
    if (!image) {
      throw new TypedHandlersError({
        message: "Failed to upload image",
        code: "INTERNAL_SERVER_ERROR",
      });
    }
    logoKey = image.key;
  }

  const now = new Date();

  // Use a transaction to ensure all operations are atomic
  const results = await db.transaction(async (tx) => {
    // Create the organization
    const newOrganization = await tx
      .insert(organization)
      .values({
        id: organizationId,
        name,
        slug,
        logo: logoKey,
        createdAt: now,
      })
      .returning();

    if (!newOrganization || !newOrganization[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create organization",
      });
    }

    // Create the owner member record
    const newMember = await tx
      .insert(member)
      .values({
        id: generateId(),
        organizationId,
        userId: session.user.id,
        role: "owner",
        createdAt: now,
      })
      .returning();

    if (!newMember || !newMember[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create member",
      });
    }

    // Create a default team for the organization
    const teamId = generateId();
    const newTeam = await tx
      .insert(team)
      .values({
        id: teamId,
        name: `${name}'s Team`,
        organizationId,
        createdAt: now,
      })
      .returning();

    if (!newTeam || !newTeam[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create default team",
      });
    }

    // Add the member to the team
    const newTeamMembership = await tx
      .insert(teamMembership)
      .values({
        id: generateId(),
        teamId,
        memberId: newMember[0].id,
      })
      .returning();

    if (!newTeamMembership || !newTeamMembership[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create team membership",
      });
    }

    return {
      organization: newOrganization[0],
      member: newMember[0],
      team: newTeam[0],
      teamMembership: newTeamMembership[0],
    };
  });

  return results;
});

export const updateOrganizationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof updateOrganizationContract
>(
  updateOrganizationContract,
  requiredSession,
  requiredOrganization,
  async ({ db, input, organization: currentOrganization, bucket, member }) => {
    if (member.role !== "admin" && member.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to update organization settings",
      });
    }

    if (input.logo instanceof File) {
      const image = await bucket.private.put(generateId(), input.logo);
      if (!image) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image",
        });
      }
      input.logo = image.key;
    } else if (input.logo === null && currentOrganization.logo) {
      await bucket.private.delete(currentOrganization.logo);
      input.logo = null;
    }

    const updatedOrganization = await db
      .update(organization)
      .set(input as any)
      .where(eq(organization.id, currentOrganization.id))
      .returning();
    if (!updatedOrganization || !updatedOrganization[0]) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update organization",
      });
    }

    return updatedOrganization[0];
  },
);
