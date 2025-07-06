import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

import { Invitation, Organization, Team, User } from "../db";

export const getInvitationContract = typedContract(
  "get /invitations/:id",
  z.strictObject({ id: z.string(), email: z.email() }),
  z.strictObject({
    ...Invitation.shape,
    inviter: User.pick({ name: true }),
    organization: Organization.pick({ name: true, slug: true, logo: true }),
    team: Team.pick({ name: true }).nullable(),
    hasUser: z.boolean(),
  }),
);
