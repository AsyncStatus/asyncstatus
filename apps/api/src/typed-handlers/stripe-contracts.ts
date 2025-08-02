import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const generateStripeCheckoutContract = typedContract(
  "post /stripe/generate-checkout",
  z.strictObject({
    plan: z.enum(["basic", "startup", "enterprise"]),
    successUrl: z.url().optional(),
    cancelUrl: z.url().optional(),
    startTrial: z.boolean().optional(),
  }),
  z.strictObject({
    checkoutUrl: z.url(),
    trialEndDate: z.iso.datetime().optional(),
  }),
);

export const stripeSuccessContract = typedContract(
  "post /stripe/success",
  z.strictObject({
    sessionId: z.string(),
  }),
  z.strictObject({
    success: z.boolean(),
    paymentStatus: z.string().optional(),
  }),
);

export const getSubscriptionContract = typedContract(
  "get /stripe/subscription",
  z.strictObject({}),
  z
    .strictObject({
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
    })
    .nullable(),
);

export const syncSubscriptionContract = typedContract(
  "post /stripe/sync",
  z.strictObject({}),
  z
    .strictObject({
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
    })
    .nullable(),
);
