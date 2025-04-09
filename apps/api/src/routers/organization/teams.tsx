import { zValidator } from "@hono/zod-validator";
import { generateId } from "better-auth";
import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";

import * as schema from "../../db/schema";
import {
  AsyncStatusNotFoundError,
  AsyncStatusUnauthorizedError,
} from "../../errors";
import type { HonoEnvWithOrganization } from "../../lib/env";
import { requiredOrganization, requiredSession } from "../../lib/middleware";
import {
  zOrganizationIdOrSlug,
  zOrganizationTeamId,
  zTeamCreate,
  zTeamMemberAdd,
  zTeamMemberRemove,
  zTeamUpdate,
} from "../../schema/organization";

export const teamsRouter = new Hono<HonoEnvWithOrganization>()
  .use(requiredOrganization)
  .use(requiredSession)
  .get("/:idOrSlug/teams", async (c) => {
    if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
      const teams = await c.var.db.query.team.findMany({
        where: eq(schema.team.organizationId, c.var.organization.id),
        with: {
          teamMemberships: {
            where: eq(schema.teamMembership.memberId, c.var.member.id),
          },
        },
      });
      return c.json(teams);
    }

    const teams = await c.var.db.query.team.findMany({
      where: eq(schema.team.organizationId, c.var.organization.id),
      with: { teamMemberships: true },
    });
    return c.json(teams);
  })
  .get(
    "/:idOrSlug/teams/:teamId",
    zValidator("param", zOrganizationTeamId.and(zOrganizationIdOrSlug)),
    async (c) => {
      const { teamId } = c.req.valid("param");
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        const team = await c.var.db.query.team.findFirst({
          where: and(
            eq(schema.team.id, teamId),
            eq(schema.team.organizationId, c.var.organization.id),
          ),
          with: {
            teamMemberships: {
              where: eq(schema.teamMembership.memberId, c.var.member.id),
            },
          },
        });
        if (!team) {
          throw new AsyncStatusNotFoundError({ message: "Team not found" });
        }
        return c.json(team);
      }

      const team = await c.var.db.query.team.findFirst({
        where: and(
          eq(schema.team.id, teamId),
          eq(schema.team.organizationId, c.var.organization.id),
        ),
        with: { teamMemberships: true },
      });
      if (!team) {
        throw new AsyncStatusNotFoundError({ message: "Team not found" });
      }
      return c.json(team);
    },
  )
  .get(
    "/:idOrSlug/teams/:teamId/members",
    zValidator("param", zOrganizationTeamId.and(zOrganizationIdOrSlug)),
    async (c) => {
      const { teamId } = c.req.valid("param");

      const existingTeam = await c.var.db.query.team.findFirst({
        where: and(
          eq(schema.team.id, teamId),
          eq(schema.team.organizationId, c.var.organization.id),
        ),
      });

      if (!existingTeam) {
        throw new AsyncStatusNotFoundError({ message: "Team not found" });
      }

      // Get team memberships with active members using explicit join
      const teamMemberships = await c.var.db
        .select({
          teamMembership: schema.teamMembership,
          member: schema.member,
          user: schema.user,
        })
        .from(schema.teamMembership)
        .innerJoin(
          schema.member,
          and(
            eq(schema.teamMembership.memberId, schema.member.id),
            eq(schema.member.organizationId, c.var.organization.id),
            isNull(schema.member.archivedAt),
          ),
        )
        .innerJoin(schema.user, eq(schema.member.userId, schema.user.id))
        .where(eq(schema.teamMembership.teamId, teamId));

      // Transform the result to match expected output format
      const result = teamMemberships.map((tm) => ({
        ...tm.teamMembership,
        member: {
          ...tm.member,
          user: tm.user,
        },
      }));

      return c.json(result);
    },
  )
  .post("/:idOrSlug/teams", zValidator("json", zTeamCreate), async (c) => {
    // Only admins and owners can create teams
    if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
      throw new AsyncStatusUnauthorizedError({
        message: "You don't have permission to create teams",
      });
    }

    const { name } = c.req.valid("json");
    const now = new Date();

    // Create the team and add the current user as the first member in a transaction
    const teamId = generateId();
    const membershipId = generateId();

    await c.var.db.transaction(async (tx) => {
      // Create the team
      await tx.insert(schema.team).values({
        id: teamId,
        name,
        organizationId: c.var.organization.id,
        createdAt: now,
        updatedAt: now,
      });

      // Add the current user as the first member
      await tx.insert(schema.teamMembership).values({
        id: membershipId,
        teamId,
        memberId: c.var.member.id,
      });
    });

    const team = await c.var.db.query.team.findFirst({
      where: eq(schema.team.id, teamId),
      with: { teamMemberships: true },
    });

    return c.json(team);
  })
  .put(
    "/:idOrSlug/teams/:teamId",
    zValidator("param", zOrganizationTeamId.and(zOrganizationIdOrSlug)),
    zValidator("json", zTeamUpdate),
    async (c) => {
      // Only admins and owners can update teams
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusUnauthorizedError({
          message: "You don't have permission to update teams",
        });
      }

      const { teamId } = c.req.valid("param");
      const updateData = c.req.valid("json");

      // Check if the team exists and belongs to the organization
      const existingTeam = await c.var.db.query.team.findFirst({
        where: and(
          eq(schema.team.id, teamId),
          eq(schema.team.organizationId, c.var.organization.id),
        ),
      });

      if (!existingTeam) {
        throw new AsyncStatusNotFoundError({ message: "Team not found" });
      }

      // Update the team
      await c.var.db
        .update(schema.team)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(schema.team.id, teamId));

      // Fetch the updated team
      const updatedTeam = await c.var.db.query.team.findFirst({
        where: eq(schema.team.id, teamId),
        with: { teamMemberships: true },
      });

      return c.json(updatedTeam);
    },
  )
  .delete(
    "/:idOrSlug/teams/:teamId",
    zValidator("param", zOrganizationTeamId.and(zOrganizationIdOrSlug)),
    async (c) => {
      // Only admins and owners can delete teams
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusUnauthorizedError({
          message: "You don't have permission to delete teams",
        });
      }

      const { teamId } = c.req.valid("param");

      // Check if the team exists and belongs to the organization
      const existingTeam = await c.var.db.query.team.findFirst({
        where: and(
          eq(schema.team.id, teamId),
          eq(schema.team.organizationId, c.var.organization.id),
        ),
      });

      if (!existingTeam) {
        throw new AsyncStatusNotFoundError({ message: "Team not found" });
      }

      // Delete the team (cascade should handle membership deletion)
      await c.var.db.delete(schema.team).where(eq(schema.team.id, teamId));

      return c.json({ success: true });
    },
  )
  .post(
    "/:idOrSlug/teams/:teamId/members",
    zValidator("param", zOrganizationTeamId.and(zOrganizationIdOrSlug)),
    zValidator("json", zTeamMemberAdd),
    async (c) => {
      // Only admins and owners can add members to teams
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusUnauthorizedError({
          message: "You don't have permission to add members to teams",
        });
      }

      const { teamId } = c.req.valid("param");
      const { memberId } = c.req.valid("json");

      // Check if the team exists and belongs to the organization
      const existingTeam = await c.var.db.query.team.findFirst({
        where: and(
          eq(schema.team.id, teamId),
          eq(schema.team.organizationId, c.var.organization.id),
        ),
      });

      if (!existingTeam) {
        throw new AsyncStatusNotFoundError({ message: "Team not found" });
      }

      // Check if the member exists and belongs to the organization
      const existingMember = await c.var.db.query.member.findFirst({
        where: and(
          eq(schema.member.id, memberId),
          eq(schema.member.organizationId, c.var.organization.id),
        ),
      });

      if (!existingMember) {
        throw new AsyncStatusNotFoundError({ message: "Member not found" });
      }

      // Check if the member is already in the team
      const existingMembership = await c.var.db.query.teamMembership.findFirst({
        where: and(
          eq(schema.teamMembership.teamId, teamId),
          eq(schema.teamMembership.memberId, memberId),
        ),
      });

      if (existingMembership) {
        return c.json({ success: true, message: "Member already in team" });
      }

      // Add member to the team
      await c.var.db.insert(schema.teamMembership).values({
        id: generateId(),
        teamId,
        memberId,
      });

      // Fetch the updated team
      const updatedTeam = await c.var.db.query.team.findFirst({
        where: eq(schema.team.id, teamId),
        with: { teamMemberships: true },
      });

      return c.json(updatedTeam);
    },
  )
  .delete(
    "/:idOrSlug/teams/:teamId/members/:memberId",
    zValidator(
      "param",
      zOrganizationTeamId.and(zOrganizationIdOrSlug).and(zTeamMemberRemove),
    ),
    async (c) => {
      // Only admins and owners can remove members from teams
      if (c.var.member.role !== "admin" && c.var.member.role !== "owner") {
        throw new AsyncStatusUnauthorizedError({
          message: "You don't have permission to remove members from teams",
        });
      }

      const { teamId, memberId } = c.req.valid("param");

      // Check if the team exists and belongs to the organization
      const existingTeam = await c.var.db.query.team.findFirst({
        where: and(
          eq(schema.team.id, teamId),
          eq(schema.team.organizationId, c.var.organization.id),
        ),
      });

      if (!existingTeam) {
        throw new AsyncStatusNotFoundError({ message: "Team not found" });
      }

      // Remove the member from the team
      await c.var.db
        .delete(schema.teamMembership)
        .where(
          and(
            eq(schema.teamMembership.teamId, teamId),
            eq(schema.teamMembership.memberId, memberId),
          ),
        );

      // Fetch the updated team
      const updatedTeam = await c.var.db.query.team.findFirst({
        where: eq(schema.team.id, teamId),
        with: { teamMemberships: true },
      });

      return c.json(updatedTeam);
    },
  );
