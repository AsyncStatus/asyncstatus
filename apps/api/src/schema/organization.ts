import { z } from "zod";

export const zOrganizationIdOrSlug = z.object({ idOrSlug: z.string().min(1) });
export const zOrganizationCreateInvite = z.object({
  email: z.string().email(),
  role: z.enum(["member", "admin"]),
});

export const zOrganizationMemberId = z.object({
  memberId: z.string().min(1),
});
