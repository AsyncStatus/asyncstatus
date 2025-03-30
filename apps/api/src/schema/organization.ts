import { z } from "zod";

export const zOrganizationIdOrSlug = z.object({ idOrSlug: z.string().min(1) });
export const zOrganizationCreateInvite = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  email: z.string().email(),
  role: z.enum(["member", "admin"]),
});

export const zOrganizationMemberId = z.object({
  memberId: z.string().min(1),
});

export const zOrganizationMemberUpdate = z
  .object({
    firstName: z.string().min(1).trim(),
    lastName: z.string().min(1).trim(),
    role: z.enum(["member", "admin", "owner"]),
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
