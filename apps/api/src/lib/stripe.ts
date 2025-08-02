import Stripe from "stripe";

export type STRIPE_SUB_CACHE = {
  subscriptionId: string | null;
  status: Stripe.Subscription.Status;
  priceId: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: number | null;
  trialStart: number | null;
  paymentMethod: {
    brand: string | null; // e.g., "visa", "mastercard"
    last4: string | null; // e.g., "4242"
  } | null;
} | null;

// Events to track as recommended in the stripe-recommendation.md
export const ALLOWED_STRIPE_EVENTS: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.upcoming",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

export function createStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2025-02-24.acacia",
    maxNetworkRetries: 3,
    timeout: 30 * 1000,
  });
}

export async function syncStripeDataToKV(
  stripe: Stripe,
  kv: KVNamespace,
  customerId: string,
): Promise<STRIPE_SUB_CACHE> {
  try {
    // Fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
      const subData: STRIPE_SUB_CACHE = null;
      await kv.put(`stripe:customer:${customerId}`, JSON.stringify(subData));
      return subData;
    }

    // If a user can have multiple subscriptions, that's your problem
    const subscription = subscriptions.data[0];
    if (!subscription) {
      const subData: STRIPE_SUB_CACHE = null;
      await kv.put(`stripe:customer:${customerId}`, JSON.stringify(subData));
      return subData;
    }

    // Store complete subscription state
    const subData: STRIPE_SUB_CACHE = {
      subscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id ?? null,
      currentPeriodEnd: subscription.current_period_end,
      currentPeriodStart: subscription.current_period_start,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end,
      trialStart: subscription.trial_start,
      paymentMethod:
        subscription.default_payment_method &&
        typeof subscription.default_payment_method !== "string"
          ? {
              brand: subscription.default_payment_method.card?.brand ?? null,
              last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : null,
    };

    // Store the data in KV
    await kv.put(`stripe:customer:${customerId}`, JSON.stringify(subData));
    return subData;
  } catch (error) {
    console.error(`[STRIPE] Error syncing data for customer ${customerId}:`, error);
    throw error;
  }
}

/**
 * Try/catch wrapper for better error handling
 */
export async function tryCatch<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: Error }> {
  try {
    const result = await fn();
    return { result };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
