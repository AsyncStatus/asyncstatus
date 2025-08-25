import { Member, StatusUpdate, StatusUpdateItem, Team, User } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const getPublicStatusUpdateContract = typedContract(
  "get /status-updates/:slug",
  z.strictObject({ slug: z.string() }),
  z.strictObject({
    ...StatusUpdate.shape,
    items: z.array(StatusUpdateItem),
    team: Team.nullable(),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);
