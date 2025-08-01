import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { user } from "../db";
import type { TypedHandlersContextWithSession } from "../lib/env";
import {
  createStripe,
  getOrCreateStripeCustomer,
  type STRIPE_SUB_CACHE,
  syncStripeDataToKV,
} from "../lib/stripe";

import { requiredSession } from "./middleware";
import {
  generateStripeCheckoutContract,
  getSubscriptionContract,
  stripeSuccessContract,
  syncSubscriptionContract,
} from "./stripe-contracts";

export const generateStripeCheckoutHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof generateStripeCheckoutContract
>(
  generateStripeCheckoutContract,
  requiredSession,
  async ({ stripe: stripeConfig, session, webAppUrl, db, input }) => {
    const { priceId, successUrl, cancelUrl, trialPeriodDays } = input;
    const stripe = createStripe(stripeConfig.secretKey);

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      stripe,
      stripeConfig.kv,
      db,
      session.user.id,
      session.user.email,
    );

    // ALWAYS create a checkout with a stripeCustomerId
    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url: successUrl || `${webAppUrl}/stripe/success`,
      cancel_url: cancelUrl || webAppUrl,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
    };

    // Add trial period if specified
    if (trialPeriodDays) {
      checkoutSessionParams.subscription_data = {
        trial_period_days: trialPeriodDays,
      };
    }

    const checkout = await stripe.checkout.sessions.create(checkoutSessionParams);

    if (!checkout.url) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create checkout session",
      });
    }

    return {
      checkoutUrl: checkout.url,
    };
  },
);

export const stripeSuccessHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof stripeSuccessContract
>(stripeSuccessContract, requiredSession, async ({ stripe: stripeConfig, session, db }) => {
  const stripe = createStripe(stripeConfig.secretKey);

  // Get the stripeCustomerId from the user record
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  const stripeCustomerId = userRecord[0]?.stripeCustomerId;
  if (!stripeCustomerId) {
    throw new TypedHandlersError({
      code: "NOT_FOUND",
      message: "Stripe customer not found",
    });
  }

  // Sync the subscription data
  await syncStripeDataToKV(stripe, stripeConfig.kv, stripeCustomerId);

  return { success: true };
});

export const getSubscriptionHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof getSubscriptionContract
>(getSubscriptionContract, requiredSession, async ({ stripe: stripeConfig, session, db }) => {
  // Get the stripeCustomerId from the user record
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  const stripeCustomerId = userRecord[0]?.stripeCustomerId;
  if (!stripeCustomerId) {
    return { status: "none" } as const;
  }

  // Get cached subscription data
  const cachedDataString = await stripeConfig.kv.get(`stripe:customer:${stripeCustomerId}`);
  if (!cachedDataString) {
    return { status: "none" } as const;
  }

  try {
    const cachedData = JSON.parse(cachedDataString) as STRIPE_SUB_CACHE;
    return cachedData;
  } catch {
    return { status: "none" } as const;
  }
});

export const syncSubscriptionHandler = typedHandler<
  TypedHandlersContextWithSession,
  typeof syncSubscriptionContract
>(syncSubscriptionContract, requiredSession, async ({ stripe: stripeConfig, session, db }) => {
  const stripe = createStripe(stripeConfig.secretKey);

  // Get the stripeCustomerId from the user record
  const userRecord = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

  const stripeCustomerId = userRecord[0]?.stripeCustomerId;
  if (!stripeCustomerId) {
    return { status: "none" } as const;
  }

  // Sync and return the fresh data
  const syncedData = await syncStripeDataToKV(stripe, stripeConfig.kv, stripeCustomerId);
  return syncedData;
});
