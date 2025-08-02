import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const purchaseAdditionalGenerationsContract = typedContract(
  "post /organizations/:idOrSlug/ai-usage/purchase-additional-generations",
  z.strictObject({
    idOrSlug: z.string().min(1),
    option: z.enum(["add_25", "add_100"]),
    paymentMethodId: z.string().optional(), // Optional - will use default if not provided
  }),
  z.strictObject({
    success: z.boolean(),
    paymentIntentId: z.string(),
    clientSecret: z.string().optional(), // For 3D Secure if needed
    generationsAdded: z.number(),
  }),
);

export const confirmAdditionalGenerationsPaymentContract = typedContract(
  "post /organizations/:idOrSlug/ai-usage/confirm-additional-generations-payment",
  z.strictObject({
    idOrSlug: z.string().min(1),
    paymentIntentId: z.string().min(1),
  }),
  z.strictObject({
    success: z.boolean(),
    generationsAdded: z.number(),
    status: z.string(),
  }),
);
