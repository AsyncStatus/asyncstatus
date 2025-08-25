import { member, team, teamMembership, user } from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq, exists, isNull, or } from "drizzle-orm";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  addTeamMemberContract,
  createTeamContract,
  deleteTeamContract,
  deleteTeamMemberContract,
  getTeamContract,
  getTeamMembersContract,
  listTeamsContract,
  updateTeamContract,
} from "./team-contracts";

export const listTeamsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listTeamsContract
>(
  listTeamsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, member: currentMember, organization }) => {
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      const teams = await db.query.team.findMany({
        where: and(
          eq(team.organizationId, organization.id),
          or(
            eq(team.createdByMemberId, currentMember.id),
            exists(
              db
                .select()
                .from(teamMembership)
                .where(
                  and(
                    eq(teamMembership.teamId, team.id),
                    eq(teamMembership.memberId, currentMember.id),
                  ),
                ),
            ),
          ),
        ),
        with: { teamMemberships: true },
      });
      return teams;
    }

    const teams = await db.query.team.findMany({
      where: eq(team.organizationId, organization.id),
      with: { teamMemberships: true },
    });
    return teams;
  },
);

export const getTeamHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getTeamContract
>(
  getTeamContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { teamId } = input;
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      // Use db.select to check if user has access to team
      const teamWithAccess = await db
        .select({
          team: team,
          membership: teamMembership,
        })
        .from(team)
        .leftJoin(
          teamMembership,
          and(eq(teamMembership.teamId, team.id), eq(teamMembership.memberId, currentMember.id)),
        )
        .where(and(eq(team.id, teamId), eq(team.organizationId, organization.id)));

      const foundTeam = teamWithAccess[0]?.team;
      const hasMembership = teamWithAccess[0]?.membership;

      if (!foundTeam) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Check if user has access (is member or creator)
      const hasAccess = foundTeam.createdByMemberId === currentMember.id || hasMembership;

      if (!hasAccess) {
        throw new TypedHandlersError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      // Get all team memberships using db.select
      const memberships = await db
        .select()
        .from(teamMembership)
        .where(eq(teamMembership.teamId, teamId));

      return {
        ...foundTeam,
        teamMemberships: memberships,
      };
    }

    const foundTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
      with: { teamMemberships: true },
    });
    if (!foundTeam) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }
    return foundTeam;
  },
);

export const getTeamMembersHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getTeamMembersContract
>(
  getTeamMembersContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { teamId } = input;

    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
    });

    if (!existingTeam) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    const teamMemberships = await db
      .select({
        teamMembership: teamMembership,
        member: member,
        user: user,
      })
      .from(teamMembership)
      .innerJoin(
        member,
        and(
          eq(teamMembership.memberId, member.id),
          eq(member.organizationId, organization.id),
          isNull(member.archivedAt),
        ),
      )
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(teamMembership.teamId, teamId));

    const result = teamMemberships.map((tm) => ({
      ...tm.teamMembership,
      member: { ...tm.member, user: tm.user },
    }));

    return result;
  },
);

export const createTeamHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof createTeamContract
>(
  createTeamContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { name } = input;
    const now = new Date();

    // Create the team and add the current user as the first member in a transaction
    const teamId = generateId();
    const membershipId = generateId();

    await db.transaction(async (tx) => {
      // Create the team
      await tx.insert(team).values({
        id: teamId,
        name,
        organizationId: organization.id,
        createdByMemberId: currentMember.id,
        createdAt: now,
        updatedAt: now,
      });

      // Add the current user as the first member
      await tx.insert(teamMembership).values({
        id: membershipId,
        teamId,
        memberId: currentMember.id,
      });
    });

    const foundTeam = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      with: { teamMemberships: true },
    });
    if (!foundTeam) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create team",
      });
    }

    return foundTeam;
  },
);

export const updateTeamHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof updateTeamContract
>(
  updateTeamContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { idOrSlug: _, teamId, ...updateData } = input;

    // Check if the team exists and belongs to the organization
    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
    });

    if (!existingTeam) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    if (
      currentMember.role !== "admin" &&
      currentMember.role !== "owner" &&
      currentMember.id !== existingTeam?.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to update teams",
      });
    }

    // Update the team
    await db
      .update(team)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(team.id, teamId));

    // Fetch the updated team
    const updatedTeam = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      with: { teamMemberships: true },
    });
    if (!updatedTeam) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update team",
      });
    }

    return updatedTeam;
  },
);

export const deleteTeamHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteTeamContract
>(
  deleteTeamContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { idOrSlug: _, teamId } = input;

    // Check if the team exists and belongs to the organization
    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
    });

    if (!existingTeam) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    if (
      currentMember.role !== "admin" &&
      currentMember.role !== "owner" &&
      currentMember.id !== existingTeam?.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete teams",
      });
    }

    // Delete the team (cascade should handle membership deletion)
    await db.delete(team).where(eq(team.id, teamId));

    return { success: true };
  },
);

export const addTeamMemberHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof addTeamMemberContract
>(
  addTeamMemberContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { idOrSlug: _, teamId, memberId } = input;

    // Check if the team exists and belongs to the organization
    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
    });

    if (!existingTeam) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    if (
      currentMember.role !== "admin" &&
      currentMember.role !== "owner" &&
      currentMember.id !== existingTeam?.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to add members to teams",
      });
    }

    // Check if the member exists and belongs to the organization
    const existingMember = await db.query.member.findFirst({
      where: and(eq(member.id, memberId), eq(member.organizationId, organization.id)),
    });

    if (!existingMember) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    // Check if the member is already in the team
    const existingMembership = await db.query.teamMembership.findFirst({
      where: and(eq(teamMembership.teamId, teamId), eq(teamMembership.memberId, memberId)),
    });

    if (existingMembership) {
      throw new TypedHandlersError({
        code: "CONFLICT",
        message: "Member already in team",
      });
    }

    // Add member to the team
    await db.insert(teamMembership).values({
      id: generateId(),
      teamId,
      memberId,
    });

    // Fetch the updated team
    const updatedTeam = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      with: { teamMemberships: true },
    });
    if (!updatedTeam) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to add member to team",
      });
    }

    return updatedTeam;
  },
);

export const deleteTeamMemberHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteTeamMemberContract
>(
  deleteTeamMemberContract,
  requiredSession,
  requiredOrganization,
  async ({ input, db, member: currentMember, organization }) => {
    const { idOrSlug: _, teamId, memberId } = input;

    // Check if the team exists and belongs to the organization
    const existingTeam = await db.query.team.findFirst({
      where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
    });

    if (!existingTeam) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Team not found",
      });
    }

    if (
      currentMember.role !== "admin" &&
      currentMember.role !== "owner" &&
      currentMember.id !== existingTeam?.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to remove members from teams",
      });
    }

    // Remove the member from the team
    await db
      .delete(teamMembership)
      .where(and(eq(teamMembership.teamId, teamId), eq(teamMembership.memberId, memberId)));

    // Fetch the updated team
    const updatedTeam = await db.query.team.findFirst({
      where: eq(team.id, teamId),
      with: { teamMemberships: true },
    });
    if (!updatedTeam) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove member from team",
      });
    }

    return updatedTeam;
  },
);
