import { TypedHandlersError, typedHandler, typedMiddleware } from "@asyncstatus/typed-handlers";
import {
  checkAiUsageLimit,
  getCurrentUsage,
  getUsageKvKey,
  getUsageStats,
} from "../lib/ai-usage-kv";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getOrganizationPlan } from "../lib/get-organization-plan";
import { createStripe } from "../lib/stripe";
import {
  addGenerationsContract,
  checkAiUsageLimitContract,
  getAiUsageStatsContract,
} from "./ai-usage-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const getAiUsageStatsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getAiUsageStatsContract
>(
  getAiUsageStatsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, stripe: stripeConfig }) => {
    // Get organization's plan from owner/admin's Stripe subscription
    const { plan: orgPlan } = await getOrganizationPlan(
      db,
      stripeConfig.secretKey,
      stripeConfig.kv,
      organization.id,
      stripeConfig.priceIds,
    );

    // Get usage stats from KV
    const stats = await getUsageStats(
      stripeConfig.kv,
      organization.id,
      orgPlan,
      stripeConfig.aiLimits,
    );

    return {
      currentMonth: stats.currentMonth,
      plan: orgPlan,
    };
  },
);

export const checkAiUsageLimitHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof checkAiUsageLimitContract
>(
  checkAiUsageLimitContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, stripe: stripeConfig }) => {
    // Get organization's plan from owner/admin's Stripe subscription
    const { plan: orgPlan } = await getOrganizationPlan(
      db,
      stripeConfig.secretKey,
      stripeConfig.kv,
      organization.id,
      stripeConfig.priceIds,
    );

    const limitCheck = await checkAiUsageLimit(
      stripeConfig.kv,
      organization.id,
      orgPlan,
      stripeConfig.aiLimits,
    );

    return {
      allowed: limitCheck.allowed,
      used: limitCheck.used,
      limit: limitCheck.limit,
      addOnAvailable: limitCheck.addOnAvailable,
      plan: orgPlan,
    };
  },
);

export const addGenerationsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof addGenerationsContract
>(
  addGenerationsContract,
  requiredSession,
  requiredOrganization,
  typedMiddleware<TypedHandlersContextWithOrganization>(({ rateLimiter }, next) =>
    rateLimiter.waitlist(next),
  ),
  async ({ organization, stripe: stripeConfig, input }) => {
    const { quantity, stripePaymentIntentId } = input;

    // Verify the payment with Stripe
    const stripe = createStripe(stripeConfig.secretKey);
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Payment not completed",
      });
    }

    // Add generations to organization's KV
    const usage = await getCurrentUsage(stripeConfig.kv, organization.id);
    usage.addOnGenerations += quantity;
    usage.lastUpdated = new Date().toISOString();

    const key = getUsageKvKey(organization.id);
    await stripeConfig.kv.put(key, JSON.stringify(usage));

    console.log(`[AI USAGE] Added ${quantity} generations to org ${organization.id}`);

    return {
      success: true,
      newTotal: usage.addOnGenerations,
    };
  },
);
