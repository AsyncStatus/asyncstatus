import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Member, MemberUpdate, Team, TeamMembership, User, UserUpdate } from "../db";

export const getMemberContract = typedContract(
  "get /organizations/:idOrSlug/members/:memberId",
  z.strictObject({ idOrSlug: z.string().min(1), memberId: z.string().min(1) }),
  z.strictObject({
    ...Member.shape,
    user: User,
    teamMemberships: z.array(z.strictObject({ ...TeamMembership.shape, team: Team })),
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
