import { zValidator } from "@hono/zod-validator";
import { and, eq, not } from "drizzle-orm";
import { Hono } from "hono";

import { invitation, member } from "../db/schema";
import type { HonoEnvWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "../lib/middleware";
import {
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
} from "../schema/organization";

export const organizationRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredSession)
  .get(
    "/:idOrSlug",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      return c.json(c.var.organization);
    },
  )
  .get(
    "/:idOrSlug/members",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    async (c) => {
      const [membersWithUsers, invitations] = await Promise.all([
        c.var.db.query.member.findMany({
          where: eq(member.organizationId, c.var.organization.id),
          with: { user: true },
        }),
        c.var.db.query.invitation.findMany({
          where: and(
            eq(invitation.organizationId, c.var.organization.id),
            not(eq(invitation.status, "accepted")),
            not(eq(invitation.status, "canceled")),
          ),
        }),
      ]);
      return c.json({ members: membersWithUsers, invitations });
    },
  )
  .post(
    "/:idOrSlug/members/invitations",
    requiredOrganization,
    zValidator("param", zOrganizationIdOrSlug),
    zValidator("json", zOrganizationCreateInvite),
    async (c) => {
      const { email, role } = c.req.valid("json");
      const hasPermissionResponse = await c.var.auth.api.hasPermission({
        body: {
          permission: { invitation: ["create"] },
          organizationId: c.var.organization.id,
        },
        headers: c.req.raw.headers,
      });
      if (!hasPermissionResponse.success) {
        return c.body(null, 403);
      }

      const existingInvitation = await c.var.db.query.invitation.findFirst({
        where: and(
          eq(invitation.organizationId, c.var.organization.id),
          eq(invitation.email, email),
        ),
      });

      if (existingInvitation) {
        return c.json("Invitation already exists", 400);
      }

      const newInvitation = await c.var.auth.api.createInvitation({
        body: {
          role,
          email,
          organizationId: c.var.organization.id,
          resend: true,
        },
        headers: c.req.raw.headers,
      });

      return c.json(newInvitation);
    },
  );
