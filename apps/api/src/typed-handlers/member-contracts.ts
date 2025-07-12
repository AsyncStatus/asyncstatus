import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Invitation, Member, MemberUpdate, Team, TeamMembership, User, UserUpdate } from "../db";
import { MemberRole } from "../db/member";

export const getMemberContract = typedContract(
  "get /organizations/:idOrSlug/members/:memberId",
  z.strictObject({ idOrSlug: z.string().min(1), memberId: z.string().min(1) }),
  z.strictObject({
    ...Member.shape,
    user: User,
    teamMemberships: z.array(z.strictObject({ ...TeamMembership.shape, team: Team })),
  }),
);

export const listMembersContract = typedContract(
  "get /organizations/:idOrSlug/members",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({
    members: z.array(z.strictObject({ ...Member.shape, user: User })),
    invitations: z.array(z.strictObject({ ...Invitation.shape, link: z.url() })),
  }),
);

export const updateMemberContract = typedContract(
  "patch /organizations/:idOrSlug/members/:memberId",
  z.strictObject({
    idOrSlug: z.string().min(1),
    memberId: z.string().min(1),
    firstName: UserUpdate.shape.name,
    lastName: UserUpdate.shape.name,
    role: MemberUpdate.shape.role,
    archivedAt: MemberUpdate.shape.archivedAt,
    timezone: UserUpdate.shape.timezone,
    image: UserUpdate.shape.image.or(z.file().max(1024 * 1024 * 10)),
  }),
  z.strictObject({ ...Member.shape, user: User }),
);

export const inviteMemberContract = typedContract(
  "post /organizations/:idOrSlug/members/invitations",
  z.strictObject({
    idOrSlug: z.string().min(1),
    firstName: z.string().min(1).trim(),
    lastName: z.string().min(1).trim(),
    email: z.email(),
    role: MemberRole,
    teamId: z.string().nullish(),
  }),
  Invitation,
);
