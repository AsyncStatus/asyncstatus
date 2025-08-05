import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

import { Invitation, Member, Organization, Team, User } from "../db";

export const getInvitationContract = typedContract(
  "get /invitations/:id",
  z.strictObject({ id: z.string() }),
  z.strictObject({
    ...Invitation.shape,
    inviter: User.pick({ name: true }),
    organization: Organization.pick({ name: true, slug: true, logo: true }),
    team: Team.pick({ name: true }).nullable(),
    hasUser: z.boolean(),
  }),
);

export const listUserInvitationsContract = typedContract(
  "get /invitations/user",
  z.strictObject({}),
  z.array(
    z.strictObject({
      ...Invitation.shape,
      inviter: User.pick({ name: true }),
      organization: Organization.pick({ name: true, slug: true, logo: true }),
      team: Team.pick({ name: true }).nullable(),
    }),
  ),
);

export const cancelInvitationContract = typedContract(
  "post /invitations/:id/cancel",
  z.strictObject({ id: z.string() }),
  Invitation,
);

export const acceptInvitationContract = typedContract(
  "post /invitations/:id/accept",
  z.strictObject({ id: z.string() }),
  z.strictObject({ organization: Organization, member: Member }),
);

export const rejectInvitationContract = typedContract(
  "post /invitations/:id/reject",
  z.strictObject({ id: z.string() }),
  Invitation,
);
