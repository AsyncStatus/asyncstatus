import { typedContract } from "@asyncstatus/typed-handlers";
import { z } from "zod/v4";

export const generateStripeCheckoutContract = typedContract(
  "post /organizations/:idOrSlug/stripe/generate-checkout",
  z.strictObject({
    plan: z.enum(["basic", "startup", "enterprise"]),
    idOrSlug: z.string().min(1),
    successUrl: z.url().optional(),
    cancelUrl: z.url().optional(),
  }),
  z.strictObject({
    checkoutUrl: z.url(),
  }),
);

export const stripeSuccessContract = typedContract(
  "get /organizations/:idOrSlug/stripe/success",
  z.object({ idOrSlug: z.string().min(1), sessionId: z.string() }),
  z.instanceof(Response),
);

export const getSubscriptionContract = typedContract(
  "get /organizations/:idOrSlug/stripe/subscription",
  z.strictObject({ idOrSlug: z.string().min(1) }),
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
      planName: z.enum(["basic", "startup", "enterprise"]).nullable(),
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
      customTrial: z
        .strictObject({
          plan: z.enum(["basic", "startup", "enterprise"]),
          startDate: z.number(),
          endDate: z.number(),
          status: z.enum(["active", "expired", "converted", "cancelled"]),
        })
        .nullable(),
      planSource: z.enum(["trial", "subscription"]).nullable(),
      usage: z
        .strictObject({
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
        })
        .nullable(),
    })
    .nullable(),
);

export const syncSubscriptionContract = typedContract(
  "post /organizations/:idOrSlug/stripe/sync",
  z.strictObject({ idOrSlug: z.string().min(1) }),
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
      planName: z.enum(["basic", "startup", "enterprise"]).nullable(),
      currentPeriodStart: z.number().nullable(),
      currentPeriodEnd: z.number().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      trialEnd: z.number().nullable(),
      trialStart: z.number().nullable(),
      customTrial: z
        .strictObject({
          plan: z.enum(["basic", "startup", "enterprise"]),
          startDate: z.number(),
          endDate: z.number(),
          status: z.enum(["active", "expired", "converted", "cancelled"]),
        })
        .nullable(),
      planSource: z.enum(["trial", "subscription"]).nullable(),
      paymentMethod: z
        .strictObject({
          brand: z.string().nullable(),
          last4: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
);

export const createPortalSessionContract = typedContract(
  "post /organizations/:idOrSlug/stripe/portal-session",
  z.strictObject({
    idOrSlug: z.string().min(1),
    returnUrl: z.url().optional(),
  }),
  z.instanceof(Response),
);

export const cancelStripeSubscriptionContract = typedContract(
  "post /organizations/:idOrSlug/stripe/cancel-subscription",
  z.strictObject({
    idOrSlug: z.string().min(1),
    reason: z.enum([
      "too_expensive",
      "missing_features",
      "switching_service",
      "no_longer_needed",
      "customer_service",
      "low_quality",
      "unused",
      "other",
    ]),
    feedback: z
      .string()
      .optional()
      .transform((val) => val?.trim() || undefined),
  }),
  z.strictObject({
    success: z.boolean(),
    message: z.string(),
  }),
);

export const reactivateStripeSubscriptionContract = typedContract(
  "post /organizations/:idOrSlug/stripe/reactivate-subscription",
  z.strictObject({ idOrSlug: z.string().min(1) }),
  z.strictObject({
    success: z.boolean(),
    message: z.string(),
  }),
);
