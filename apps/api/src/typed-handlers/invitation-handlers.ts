import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, eq } from "drizzle-orm";

import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getInvitationContract } from "./invitation-contracts";

export const getInvitationHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getInvitationContract
>(getInvitationContract, async ({ db, input, session }) => {
  const { id } = input;
  const { email } = input;

  const [invitation, user] = await Promise.all([
    db.query.invitation.findFirst({
      where: and(eq(schema.invitation.id, id), eq(schema.invitation.email, email)),
      with: {
        inviter: { columns: { name: true } },
        organization: { columns: { name: true, slug: true, logo: true } },
        team: { columns: { name: true } },
      },
    }),
    db.query.user.findFirst({
      where: eq(schema.user.email, email),
    }),
  ]);

  if (!invitation || (session && session.user.email !== invitation.email)) {
    throw new TypedHandlersError({
      message: "Invitation not found",
      code: "NOT_FOUND",
    });
  }

  return {
    ...invitation,
    hasUser: Boolean(user),
  };
});
