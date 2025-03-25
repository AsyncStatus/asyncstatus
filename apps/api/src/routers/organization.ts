import { zValidator } from "@hono/zod-validator";
import { and, eq, not } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../db/schema";
import type { HonoEnvWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "../lib/middleware";
import {
  zOrganizationCreateInvite,
  zOrganizationIdOrSlug,
  zOrganizationMemberId,
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
      const hasPermissionResponse = await c.var.auth.api.hasPermission({
        body: {
          permission: { member: ["update"] },
          organizationId: c.var.organization.id,
        },
        headers: c.req.raw.headers,
      });
      if (!hasPermissionResponse.success) {
        return c.json(null, 403);
      }

      const member = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.organizationId, c.var.organization.id),
          eq(schema.member.id, memberId),
        ),
        with: { user: true },
      });
      if (!member) {
        return c.json("Member not found", 404);
      }

      return c.json(member);
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
        return c.json(null, 403);
      }

      const [existingInvitation, existingUser] = await Promise.all([
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
      if (existingInvitation || existingUser?.user) {
        return c.json("User already a member or has an invitation", 400);
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
