import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const generateStripeCheckoutContract = typedContract(
  "post /stripe/generate-checkout",
  z.strictObject({
    priceId: z.string().min(1),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
    trialPeriodDays: z.number().int().min(1).max(365).optional(),
  }),
  z.strictObject({
    checkoutUrl: z.string().url(),
  }),
);

export const stripeSuccessContract = typedContract(
  "post /stripe/success",
  z.strictObject({}),
  z.strictObject({
    success: z.boolean(),
  }),
);

export const getSubscriptionContract = typedContract(
  "get /stripe/subscription",
  z.strictObject({}),
  z.union([
    z.strictObject({
      subscriptionId: z.string().nullable(),
      status: z.enum([
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ]),
      priceId: z.string().nullable(),
      currentPeriodStart: z.number().nullable(),
      currentPeriodEnd: z.number().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      trialEnd: z.number().nullable(),
      trialStart: z.number().nullable(),
      paymentMethod: z
        .strictObject({
          brand: z.string().nullable(),
          last4: z.string().nullable(),
        })
        .nullable(),
    }),
    z.strictObject({
      status: z.literal("none"),
    }),
  ]),
);

export const syncSubscriptionContract = typedContract(
  "post /stripe/sync",
  z.strictObject({}),
  z.union([
    z.strictObject({
      subscriptionId: z.string().nullable(),
      status: z.enum([
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ]),
      priceId: z.string().nullable(),
      currentPeriodStart: z.number().nullable(),
      currentPeriodEnd: z.number().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      trialEnd: z.number().nullable(),
      trialStart: z.number().nullable(),
      paymentMethod: z
        .strictObject({
          brand: z.string().nullable(),
          last4: z.string().nullable(),
        })
        .nullable(),
    }),
    z.strictObject({
      status: z.literal("none"),
    }),
  ]),
);
