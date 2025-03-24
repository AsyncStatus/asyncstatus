import { eq, or } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import { member, organization } from "../db/schema";
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
      return c.body(null, 400);
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
      return c.body(null, 404);
    }
    const { members, ...restOrg } = org;
    if (!members[0]) {
      return c.body(null, 403);
    }

    c.set("organization", { ...restOrg, slug: org.slug! });
    c.set("member", { ...members[0], teamId: members[0].teamId ?? undefined });
    await next();
  },
);
