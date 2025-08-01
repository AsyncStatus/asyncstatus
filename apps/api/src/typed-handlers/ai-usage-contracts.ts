import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const getAiUsageStatsContract = typedContract(
  "get /ai-usage/stats",
  z.strictObject({}),
  z.strictObject({
    currentMonth: z.strictObject({
      used: z.number(),
      limit: z.number(),
      planLimit: z.number(),
      addOnGenerations: z.number(),
      remaining: z.number(),
      byType: z.strictObject({
        status_generation: z.number(),
        summary_generation: z.number(),
      }),
    }),
    plan: z.enum(["basic", "startup", "enterprise"]),
  }),
);

export const checkAiUsageLimitContract = typedContract(
  "get /ai-usage/check-limit",
  z.strictObject({}),
  z.strictObject({
    allowed: z.boolean(),
    used: z.number(),
    limit: z.number(),
    addOnAvailable: z.number(),
    plan: z.enum(["basic", "startup", "enterprise"]),
  }),
);

export const addGenerationsContract = typedContract(
  "post /ai-usage/add-generations",
  z.strictObject({
    quantity: z.number().int().min(1).max(10000),
    stripePaymentIntentId: z.string().min(1), // Verify payment
  }),
  z.strictObject({
    success: z.boolean(),
    newTotal: z.number(),
  }),
);
