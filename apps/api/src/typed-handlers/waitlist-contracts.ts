import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const joinWaitlistContract = typedContract(
  "post /waitlist",
  z.strictObject({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.email(),
  }),
  z.strictObject({ ok: z.boolean() }),
);
