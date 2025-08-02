import { TypedHandlersError, typedHandler, typedMiddleware } from "@asyncstatus/typed-handlers";
import {
  checkAiUsageLimit,
  getCurrentUsage,
  getUsageKvKey,
  getUsageStats,
} from "../lib/ai-usage-kv";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getOrganizationPlan } from "../lib/get-organization-plan";
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
  async ({ db, organization, stripeClient, stripeConfig }) => {
    const orgPlan = await getOrganizationPlan(
      db,
      stripeClient,
      stripeConfig.kv,
      organization.id,
      stripeConfig.priceIds,
    );

    if (!orgPlan) {
      return null;
    }

    const stats = await getUsageStats(
      stripeConfig.kv,
      organization.id,
      orgPlan.plan,
      stripeConfig.aiLimits,
    );

    return {
      currentMonth: stats.currentMonth,
      plan: orgPlan.plan,
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
  async ({ db, organization, stripeClient, stripeConfig }) => {
    const orgPlan = await getOrganizationPlan(
      db,
      stripeClient,
      stripeConfig.kv,
      organization.id,
      stripeConfig.priceIds,
    );

    if (!orgPlan) {
      return null;
    }

    const limitCheck = await checkAiUsageLimit(
      stripeConfig.kv,
      organization.id,
      orgPlan.plan,
      stripeConfig.aiLimits,
    );

    return {
      allowed: limitCheck.allowed,
      used: limitCheck.used,
      limit: limitCheck.limit,
      addOnAvailable: limitCheck.addOnAvailable,
      plan: orgPlan.plan,
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
  async ({ organization, stripeConfig, input, stripeClient }) => {
    const { quantity, stripePaymentIntentId } = input;

    const paymentIntent = await stripeClient.paymentIntents.retrieve(stripePaymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Payment not completed",
      });
    }

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
