import { z } from "zod";

export const zUserProfileUpdate = z.object({
  name: z.string().min(1).trim().optional(),
  timezone: z.string().optional(), // IANA timezone identifier (e.g., "America/New_York")
  image: z.any().transform((val) => {
    if (val instanceof File) {
      return val;
    }
    if (typeof val === "string") {
      return val;
    }
    return null;
  }).optional(),
}).partial();