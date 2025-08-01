import type { STRIPE_SUB_CACHE } from "./stripe";

// Map Stripe price IDs to plan names
export const STRIPE_PRICE_TO_PLAN = {
  // Replace with your actual Stripe price IDs
  price_basic_monthly: "basic",
  price_startup_monthly: "startup",
  price_enterprise_monthly: "enterprise",
} as const;

export type UserPlan = "basic" | "startup" | "enterprise";

/**
 * Determine user's plan from Stripe subscription data
 */
export function getUserPlanFromStripe(subscription: STRIPE_SUB_CACHE): UserPlan {
  if (subscription.status === "none") {
    return "basic"; // Default to basic for non-subscribers
  }

  const priceId = subscription.priceId;
  if (!priceId) {
    return "basic";
  }

  // Map Stripe price ID to plan
  const plan = Object.entries(STRIPE_PRICE_TO_PLAN).find(
    ([stripePriceId]) => stripePriceId === priceId,
  )?.[1];

  return plan || "basic"; // Default to basic if price ID not found
}

/**
 * Get plan features for display
 */
export function getPlanFeatures(plan: UserPlan) {
  const features = {
    basic: {
      name: "Basic",
      price: "$9/month",
      aiGenerations: 50,
      users: 5,
      teams: 2,
      schedules: 1,
    },
    startup: {
      name: "Startup",
      price: "$49/month",
      aiGenerations: 500,
      users: "Unlimited",
      teams: "Unlimited",
      schedules: "Unlimited",
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom",
      aiGenerations: "Unlimited",
      users: "Unlimited",
      teams: "Unlimited",
      schedules: "Unlimited",
    },
  };

  return features[plan];
}
