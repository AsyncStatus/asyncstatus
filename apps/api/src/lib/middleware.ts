import { eq, or } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { member, organization } from "../db/schema";
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

export const requiredOrganization = createMiddleware<HonoEnvWithOrganization>(
  async (c, next) => {
    const orgOrSlug = c.req.param("idOrSlug");
    if (!orgOrSlug) {
      throw new AsyncStatusBadRequestError({
        message: "Organization ID or slug is required",
      });
    }

    const org = await c.var.db.query.organization.findFirst({
      where: or(
        eq(organization.id, orgOrSlug),
        eq(organization.slug, orgOrSlug),
      ),
      with: {
        members: {
          limit: 1,
          where: eq(member.userId, c.var.session.user.id),
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

    c.set("organization", { ...restOrg, slug: org.slug! });
    c.set("member", { ...members[0], teamId: members[0].teamId ?? undefined });
    await next();
  },
);
