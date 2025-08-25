import { Member, StatusUpdate, StatusUpdateItem, Team, User } from "@asyncstatus/db";
import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const shareStatusUpdateContract = typedContract(
  "post /organizations/:idOrSlug/status-updates/:statusUpdateId/share",
  z.strictObject({ idOrSlug: z.string(), statusUpdateId: z.string() }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);

export const listStatusUpdatesByDateContract = typedContract(
  "get /organizations/:idOrSlug/status-updates/date/:date",
  z.strictObject({
    idOrSlug: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    memberId: z.string().optional(),
    teamId: z.string().optional(),
  }),
  z.array(
    z.strictObject({
      ...StatusUpdate.shape,
      team: Team.nullable(),
      items: z.array(StatusUpdateItem),
      member: z.strictObject({ ...Member.shape, user: User }),
    }),
  ),
);

export const getStatusUpdateContract = typedContract(
  "get /organizations/:idOrSlug/status-updates/:statusUpdateIdOrDate",
  z.strictObject({ idOrSlug: z.string(), statusUpdateIdOrDate: z.string() }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);

export const getMemberStatusUpdateContract = typedContract(
  "get /organizations/:idOrSlug/status-updates/:statusUpdateIdOrDate/current-member",
  z.strictObject({
    idOrSlug: z.string(),
    statusUpdateIdOrDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);

export const createStatusUpdateContract = typedContract(
  "post /organizations/:idOrSlug/status-updates",
  z.strictObject({
    idOrSlug: z.string(),
    teamId: z.string().nullish(),
    effectiveFrom: z.string(),
    effectiveTo: z.string(),
    mood: z.string().nullish(),
    emoji: z.string().nullish(),
    editorJson: z
      .unknown()
      .refine((val): val is object => {
        if (!val) {
          return true;
        }

        if (typeof val !== "object") {
          return false;
        }

        if (Array.isArray(val)) {
          return false;
        }

        return true;
      }, "Editor JSON must be an object or nullish value")
      .nullish(),
    notes: z.string().nullish(),
    items: z
      .array(
        z.strictObject({
          id: z.string().optional(),
          content: z.string().min(1),
          isBlocker: z.boolean().default(false),
          isInProgress: z.boolean().default(false),
          order: z.number().int().nonnegative(),
        }),
      )
      .optional(),
    isDraft: z.boolean().default(true),
  }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);

export const updateStatusUpdateContract = typedContract(
  "post /organizations/:idOrSlug/status-updates-update/:statusUpdateId",
  z.strictObject({
    idOrSlug: z.string(),
    statusUpdateId: z.string(),
    teamId: z.string().nullish(),
    effectiveFrom: z.string(),
    effectiveTo: z.string(),
    mood: z.string().nullish(),
    emoji: z.string().nullish(),
    editorJson: z
      .unknown()
      .refine((val): val is object => {
        if (!val) {
          return true;
        }

        if (typeof val !== "object") {
          return false;
        }

        if (Array.isArray(val)) {
          return false;
        }

        return true;
      }, "Editor JSON must be an object or nullish value")
      .nullish(),
    notes: z.string().nullish(),
    items: z
      .array(
        z.strictObject({
          id: z.string(),
          content: z.string().min(1),
          isBlocker: z.boolean().default(false),
          isInProgress: z.boolean().default(false),
          order: z.number().int().nonnegative(),
        }),
      )
      .optional(),
    isDraft: z.boolean().default(true),
  }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);

export const generateStatusUpdateContract = typedContract(
  "post /organizations/:idOrSlug/status-updates/generate",
  z.strictObject({
    idOrSlug: z.string(),
    effectiveFrom: z.string(),
    effectiveTo: z.string(),
  }),
  z.strictObject({
    ...StatusUpdate.shape,
    team: Team.nullable(),
    items: z.array(StatusUpdateItem),
    member: z.strictObject({ ...Member.shape, user: User }),
  }),
);
