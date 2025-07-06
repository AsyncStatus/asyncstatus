import { desc, eq, or } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { member, organization } from "../db";
import {
  AsyncStatusBadRequestError,
  AsyncStatusForbiddenError,
  AsyncStatusNotFoundError,
} from "../errors";
import type { HonoEnv, HonoEnvWithOrganization } from "./env";

export const requiredSession = createMiddleware<HonoEnv>(async (c, next) => {
  const session = c.get("session");
  if (!session) {
    return c.body(null, 401);
  }
  await next();
});

export const requiredOrganization = createMiddleware<HonoEnvWithOrganization>(async (c, next) => {
  const idOrSlug = c.req.param("idOrSlug") ?? c.req.url.split("/organization/")[1]?.split("/")[0];
  if (!idOrSlug) {
    throw new AsyncStatusBadRequestError({
      message: "Organization ID or slug is required",
    });
  }

  const org = await c.var.db.query.organization.findFirst({
    where: or(eq(organization.id, idOrSlug), eq(organization.slug, idOrSlug)),
    with: {
      members: {
        limit: 1,
        where: eq(member.userId, c.var.session.user.id),
        orderBy: [desc(member.role)],
      },
    },
  });
  if (!org) {
    throw new AsyncStatusNotFoundError({
      message: "Organization not found",
    });
  }
  const { members, ...restOrg } = org;
  if (!members[0]) {
    throw new AsyncStatusForbiddenError({
      message: "You are not a member of this organization",
    });
  }

  c.set("organization", restOrg);
  c.set("member", members[0]);
  await next();
});
