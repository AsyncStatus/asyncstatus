import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { desc, eq } from "drizzle-orm";
import { member, organization, team, teamMembership, user } from "../db";
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
  const result = await db
    .select({ organization: organization, member: member })
    .from(organization)
    .innerJoin(member, eq(organization.id, member.organizationId))
    .where(eq(member.userId, session.user.id))
    .orderBy(desc(organization.createdAt))
    .limit(100);

  return result;
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
  async ({ db, session, authKv, organization }) => {
    await db
      .update(user)
      .set({ activeOrganizationSlug: organization.slug })
      .where(eq(user.id, session.user.id));

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
        session: { ...data.session, activeOrganizationSlug: organization.slug },
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

    await tx
      .update(user)
      .set({ activeOrganizationSlug: newOrganization[0].slug })
      .where(eq(user.id, session.user.id));

    return {
      organization: newOrganization[0],
      member: newMember[0],
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
