import { z } from "zod";

export const zStatusUpdateCreate = z.object({
  memberId: z.string().min(1),
  organizationId: z.string().min(1).optional(),
  teamId: z.string().optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date(),
  mood: z.string().optional(),
  emoji: z.string().optional(),
  isDraft: z.boolean().default(true),
});

export const zStatusUpdateUpdate = z
  .object({
    teamId: z.string().optional().nullable(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().optional(),
    mood: z.string().optional().nullable(),
    emoji: z.string().optional().nullable(),
    isDraft: z.boolean().optional(),
  })
  .partial();

export const zStatusUpdateItemCreate = z.object({
  statusUpdateId: z.string().min(1),
  content: z.string().min(1),
  isBlocker: z.boolean().default(false),
  order: z.number().int().nonnegative(),
});

export const zStatusUpdateItemUpdate = z
  .object({
    content: z.string().min(1).optional(),
    isBlocker: z.boolean().optional(),
    order: z.number().int().nonnegative().optional(),
  })
  .partial();

export const zStatusUpdateId = z.object({
  statusUpdateId: z.string().min(1),
});

export const zStatusUpdateItemId = z.object({
  statusUpdateItemId: z.string().min(1),
});

export const zPublicStatusShareCreate = z.object({
  statusUpdateId: z.string().min(1),
  slug: z.string().min(1),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const zPublicStatusShareUpdate = z
  .object({
    slug: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.coerce.date().optional().nullable(),
  })
  .partial();

export const zPublicStatusShareId = z.object({
  publicShareId: z.string().min(1),
});

export const zPublicStatusShareSlug = z.object({
  slug: z.string().min(1),
});
