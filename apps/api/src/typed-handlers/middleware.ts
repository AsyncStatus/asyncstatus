import { TypedHandlersError, typedMiddleware } from "@asyncstatus/typed-handlers";
import { desc, eq, or } from "drizzle-orm";
import { member, organization } from "../db";
import type {
  TypedHandlersContextWithOrganization,
  TypedHandlersContextWithSession,
} from "../lib/env";

export const requiredSession = typedMiddleware<TypedHandlersContextWithSession>(
  async ({ session }, next) => {
    if (!session) {
      throw new TypedHandlersError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return next();
  },
);

export const requiredOrganization = typedMiddleware<TypedHandlersContextWithOrganization>(
  async ({ req, db, set, session }, next) => {
    let idOrSlug = req.url.includes("/organizations/")
      ? req.url.split("/organizations/")[1]?.split("/")[0]
      : undefined;
    idOrSlug = idOrSlug?.endsWith("?") ? idOrSlug.slice(0, -1) : idOrSlug;
    if (!idOrSlug) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Organization ID or slug is required",
      });
    }

    const org = await db.query.organization.findFirst({
      where: or(eq(organization.id, idOrSlug), eq(organization.slug, idOrSlug)),
      with: {
        members: {
          limit: 1,
          where: eq(member.userId, session.user.id),
          orderBy: [desc(member.role)],
        },
      },
    });
    if (!org) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }
    const { members, ...restOrg } = org;
    if (!members[0]) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    set("organization", restOrg);
    set("member", members[0]);
    return next();
  },
);
