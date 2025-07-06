import { z } from "zod/v4";

export const zCreateWaitlistUser = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
});
