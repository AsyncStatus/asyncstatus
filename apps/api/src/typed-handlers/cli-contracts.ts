import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";
import { Member, StatusUpdate, StatusUpdateItem, Team, User } from "../db";

export const addCliStatusUpdateItemContract = typedContract(
  "post /organizations/:idOrSlug/cli/status-updates",
  z.strictObject({
    idOrSlug: z.string(),
    type: z.enum(["done", "progress", "blocker"]),
    message: z.string().min(1),
  }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);

export const undoLastCliStatusUpdateItemContract = typedContract(
  "delete /organizations/:idOrSlug/cli/status-updates/last",
  z.strictObject({
    idOrSlug: z.string(),
  }),
  z.strictObject({
    success: z.boolean(),
    deletedStatusUpdate: z.boolean(), // true if entire status update was deleted
    message: z.string(),
  }),
);

export const showCurrentStatusUpdateContract = typedContract(
  "get /organizations/:idOrSlug/cli/status-updates/current",
  z.strictObject({
    idOrSlug: z.string(),
  }),
  z.strictObject({
    statusUpdate: z
      .strictObject({
        ...StatusUpdate.shape,
        team: Team.nullable(),
        items: z.array(StatusUpdateItem),
        member: z.strictObject({ ...Member.shape, user: User }),
      })
      .nullable(),
    message: z.string(),
  }),
);

export const listRecentStatusUpdatesContract = typedContract(
  "get /organizations/:idOrSlug/cli/status-updates/recent",
  z.strictObject({
    idOrSlug: z.string(),
    days: z.coerce.number().min(1).max(30).optional().default(1),
  }),
  z.strictObject({
    statusUpdates: z.array(
      z.strictObject({
        ...StatusUpdate.shape,
        team: Team.nullable(),
        items: z.array(StatusUpdateItem),
        member: z.strictObject({ ...Member.shape, user: User }),
      }),
    ),
    message: z.string(),
  }),
);
