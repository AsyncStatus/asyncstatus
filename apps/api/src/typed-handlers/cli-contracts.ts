import { Member, StatusUpdate, StatusUpdateItem, Team, User } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const addCliStatusUpdateItemContract = typedContract(
  "post /cli/status-updates",
  z.strictObject({
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
  "delete /cli/status-updates/last",
  z.strictObject({}),
  z.strictObject({
    success: z.boolean(),
    deletedStatusUpdate: z.boolean(), // true if entire status update was deleted
    message: z.string(),
  }),
);

export const showCurrentStatusUpdateContract = typedContract(
  "get /cli/status-updates/current",
  z.strictObject({}),
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
  "get /cli/status-updates/recent",
  z.strictObject({
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

export const editCliStatusUpdateContract = typedContract(
  "put /cli/status-updates/edit",
  z.strictObject({
    items: z.array(
      z.strictObject({
        content: z.string().min(1),
        type: z.enum(["done", "progress", "blocker"]),
        order: z.number().int().nonnegative(),
      }),
    ),
    date: z.string().optional(), // ISO date string, defaults to today
    mood: z.string().nullable().optional(), // Mood field
    notes: z.string().nullable().optional(), // Notes field
  }),
  z.strictObject({
    statusUpdate: z.strictObject({
      ...StatusUpdate.shape,
      team: Team.nullable(),
      items: z.array(StatusUpdateItem),
      member: z.strictObject({ ...Member.shape, user: User }),
    }),
    message: z.string(),
  }),
);

export const getCliStatusUpdateByDateContract = typedContract(
  "get /cli/status-updates/by-date",
  z.strictObject({ date: z.iso.date() }),
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
