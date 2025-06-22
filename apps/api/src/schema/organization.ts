import { z } from "zod";

export const zOrganizationIdOrSlug = z.object({ idOrSlug: z.string().min(1) });
export const zOrganizationTeamId = z.object({ teamId: z.string().min(1) });
export const zOrganizationCreateInvite = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  email: z.string().email(),
  role: z.enum(["member", "admin", "owner"]),
  teamId: z.string().nullish(),
});

export const zOrganizationMemberId = z.object({
  memberId: z.string().min(1),
});

export const zOrganizationMemberUpdate = z
  .object({
    firstName: z.string().min(1).trim(),
    lastName: z.string().min(1).trim(),
    role: z.enum(["member", "admin", "owner"]),
    archivedAt: z.string().nullish(),
    slackUsername: z.string().trim().nullish(),
    image: z.any().transform((val) => {
      if (val instanceof File) {
        return val;
      }

      if (typeof val === "string") {
        return val;
      }

      return null;
    }),
  })
  .partial();

export const zUserTimezoneUpdate = z.object({
  timezone: z.string().min(1).trim(),
});

export const zOrganizationUpdate = z
  .object({
    name: z.string().min(1).trim(),
    slug: z.string().min(1).trim(),
    logo: z.any().transform((val) => {
      if (val instanceof File) {
        return val;
      }

      if (typeof val === "string") {
        return val;
      }

      return null;
    }),
  })
  .partial();

export const zOrganizationCreate = z.object({
  name: z.string().min(1).trim(),
  slug: z.string().min(1).trim(),
  logo: z
    .any()
    .transform((val) => {
      if (val instanceof File) {
        return val;
      }

      if (typeof val === "string") {
        return val;
      }

      return null;
    })
    .optional(),
});

// Team schemas
export const zTeamCreate = z.object({
  name: z.string().min(1).trim(),
});

export const zTeamUpdate = z
  .object({
    name: z.string().min(1).trim(),
  })
  .partial();

export const zTeamMemberAdd = z.object({
  memberId: z.string().min(1),
});

export const zTeamMemberRemove = z.object({
  memberId: z.string().min(1),
});
