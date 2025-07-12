import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq, isNull } from "drizzle-orm";
import { member, team, teamMembership, user } from "../db";
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
        where: eq(team.organizationId, organization.id),
        with: {
          teamMemberships: {
            where: eq(teamMembership.memberId, currentMember.id),
          },
        },
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
      const foundTeam = await db.query.team.findFirst({
        where: and(eq(team.id, teamId), eq(team.organizationId, organization.id)),
        with: {
          teamMemberships: {
            where: eq(teamMembership.memberId, currentMember.id),
          },
        },
      });
      if (!foundTeam) {
        throw new TypedHandlersError({
          code: "FORBIDDEN",
          message: "You are not authorized to access this team",
        });
      }
      return foundTeam;
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
  async ({ input, db, organization }) => {
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

    // Get team memberships with active members using explicit join
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
    // Only admins and owners can create teams
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to create teams",
      });
    }

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
    // Only admins and owners can update teams
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to update teams",
      });
    }

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

    // Update the team
    await db
      .update(team)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
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
    // Only admins and owners can delete teams
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to delete teams",
      });
    }

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
    // Only admins and owners can add members to teams
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to add members to teams",
      });
    }

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
    // Only admins and owners can remove members from teams
    if (currentMember.role !== "admin" && currentMember.role !== "owner") {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You don't have permission to remove members from teams",
      });
    }

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
