import { z } from "zod";

export const zCreateWaitlistUser = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
});
