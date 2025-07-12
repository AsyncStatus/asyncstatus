import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Member, Team, TeamMembership, User } from "../db";

export const listTeamsContract = typedContract(
  "get /organizations/:idOrSlug/teams",
  z.strictObject({ idOrSlug: z.string() }),
  z.array(z.strictObject({ ...Team.shape, teamMemberships: z.array(TeamMembership) })),
);

export const getTeamContract = typedContract(
  "get /organizations/:idOrSlug/teams/:teamId",
  z.strictObject({ idOrSlug: z.string(), teamId: z.string() }),
  z.strictObject({ ...Team.shape, teamMemberships: z.array(TeamMembership) }),
);

export const getTeamMembersContract = typedContract(
  "get /organizations/:idOrSlug/teams/:teamId/members",
  z.strictObject({ idOrSlug: z.string(), teamId: z.string() }),
  z.array(
    z.strictObject({
      ...TeamMembership.shape,
      member: z.strictObject({ ...Member.shape, user: User }),
    }),
  ),
);

export const createTeamContract = typedContract(
  "post /organizations/:idOrSlug/teams",
  z.strictObject({ idOrSlug: z.string(), name: z.string().min(1).trim() }),
  z.strictObject({ ...Team.shape, teamMemberships: z.array(TeamMembership) }),
);

export const updateTeamContract = typedContract(
  "put /organizations/:idOrSlug/teams/:teamId",
  z.strictObject({ idOrSlug: z.string(), teamId: z.string(), name: z.string().min(1).trim() }),
  z.strictObject({ ...Team.shape, teamMemberships: z.array(TeamMembership) }),
);

export const deleteTeamContract = typedContract(
  "delete /organizations/:idOrSlug/teams/:teamId",
  z.strictObject({ idOrSlug: z.string(), teamId: z.string() }),
  z.strictObject({ success: z.boolean() }),
);

export const addTeamMemberContract = typedContract(
  "post /organizations/:idOrSlug/teams/:teamId/members",
  z.strictObject({ idOrSlug: z.string(), teamId: z.string(), memberId: z.string() }),
  z.strictObject({ ...Team.shape, teamMemberships: z.array(TeamMembership) }),
);

export const deleteTeamMemberContract = typedContract(
  "delete /organizations/:idOrSlug/teams/:teamId/members/:memberId",
  z.strictObject({ idOrSlug: z.string(), teamId: z.string(), memberId: z.string() }),
  z.strictObject({ ...Team.shape, teamMemberships: z.array(TeamMembership) }),
);
