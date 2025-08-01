import { dayjs } from "@asyncstatus/dayjs";
import type Stripe from "stripe";
import { createStripe } from "./stripe";

export type AiUsageType = "status_generation" | "summary_generation";

export interface OrganizationUsage {
  organizationId: string;
  currentMonth: string; // "2024-01"
  usage: {
    status_generation: number;
    summary_generation: number;
    total: number;
  };
  addOnGenerations: number; // Never expire
  lastUpdated: string;
}

export interface PlanLimits {
  basic: { monthlyLimit: number; stripeMeteredPriceId?: string };
  startup: { monthlyLimit: number; stripeMeteredPriceId?: string };
  enterprise: { monthlyLimit: number; stripeMeteredPriceId?: string };
}

// AI generation limits are now configured via environment variables
// This will be replaced with dynamic limits from context
export const AI_GENERATION_LIMITS: PlanLimits = {
  basic: { monthlyLimit: 100 }, // Fallback - will be overridden
  startup: { monthlyLimit: 500 }, // Fallback - will be overridden
  enterprise: { monthlyLimit: 10000 }, // Fallback - will be overridden
};

export function getUsageKvKey(organizationId: string): string {
  const currentMonth = dayjs().startOf("month").format("YYYY-MM");
  return `ai_usage:${organizationId}:${currentMonth}`;
}

export async function getCurrentUsage(
  kv: KVNamespace,
  organizationId: string,
): Promise<OrganizationUsage> {
  const key = getUsageKvKey(organizationId);
  const stored = await kv.get<OrganizationUsage>(key, { type: "json" });

  const currentMonth = dayjs().startOf("month").format("YYYY-MM");

  if (stored && stored.currentMonth === currentMonth) {
    return stored;
  }

  // Initialize new month or first time
  const newUsage: OrganizationUsage = {
    organizationId,
    currentMonth,
    usage: {
      status_generation: 0,
      summary_generation: 0,
      total: 0,
    },
    addOnGenerations: stored?.addOnGenerations || 0, // Preserve add-ons across months
    lastUpdated: new Date().toISOString(),
  };

  await kv.put(key, JSON.stringify(newUsage));
  return newUsage;
}

/**
 * Check if organization has exceeded their AI generation limit
 */
export async function checkAiUsageLimit(
  kv: KVNamespace,
  organizationId: string,
  plan: keyof PlanLimits,
  aiLimits?: { basic: number; startup: number; enterprise: number },
): Promise<{ allowed: boolean; used: number; limit: number; addOnAvailable: number }> {
  const usage = await getCurrentUsage(kv, organizationId);
  const planLimit = aiLimits ? aiLimits[plan] : AI_GENERATION_LIMITS[plan].monthlyLimit;
  const totalLimit = planLimit + usage.addOnGenerations;

  return {
    allowed: usage.usage.total < totalLimit,
    used: usage.usage.total,
    limit: totalLimit,
    addOnAvailable: usage.addOnGenerations,
  };
}

/**
 * Track AI usage with plan limit checking
 */
export async function trackAiUsage(
  kv: KVNamespace,
  stripeSecretKey: string,
  organizationId: string,
  type: AiUsageType,
  plan: keyof PlanLimits,
  stripeCustomerId?: string,
  quantity: number = 1,
  aiLimits?: { basic: number; startup: number; enterprise: number },
): Promise<{ success: boolean; limitExceeded?: boolean }> {
  // Check limits before tracking
  const limitCheck = await checkAiUsageLimit(kv, organizationId, plan, aiLimits);

  if (!limitCheck.allowed) {
    console.log(
      `[AI USAGE] Limit exceeded for org ${organizationId}. Used: ${limitCheck.used}/${limitCheck.limit}`,
    );
    return {
      success: false,
      limitExceeded: true,
    };
  }

  // Update KV usage
  const usage = await getCurrentUsage(kv, organizationId);
  usage.usage[type] += quantity;
  usage.usage.total += quantity;
  usage.lastUpdated = new Date().toISOString();

  const key = getUsageKvKey(organizationId);
  await kv.put(key, JSON.stringify(usage));

  // Report to Stripe for billing (if customer has subscription)
  if (stripeCustomerId && stripeSecretKey) {
    try {
      const stripe = createStripe(stripeSecretKey);

      // You would need to get the subscription item ID from the customer's subscription
      // For now, we'll just log it - you can implement the actual reporting based on your Stripe setup
      await reportUsageToStripe(stripe, stripeCustomerId, quantity);
    } catch (error) {
      console.error("[AI USAGE] Failed to report to Stripe:", error);
      // Don't fail the operation if Stripe reporting fails
    }
  }

  console.log(
    `[AI USAGE] Tracked ${quantity}x ${type} for org ${organizationId} (${usage.usage.total}/${limitCheck.limit})`,
  );

  return { success: true };
}

/**
 * Report usage to Stripe (simplified version)
 */
async function reportUsageToStripe(
  stripe: Stripe,
  customerId: string,
  quantity: number,
): Promise<void> {
  // Get customer's subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return; // No active subscription
  }

  const subscription = subscriptions.data[0];

  // Find metered subscription item (you'd configure this based on your Stripe setup)
  const meteredItem = subscription?.items.data.find(
    (item) => item.price.recurring?.usage_type === "metered",
  );

  if (meteredItem) {
    await stripe.subscriptionItems.createUsageRecord(meteredItem.id, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: "increment",
    });
  }
}

export async function getUsageStats(
  kv: KVNamespace,
  organizationId: string,
  plan: keyof PlanLimits,
  aiLimits?: { basic: number; startup: number; enterprise: number },
) {
  const usage = await getCurrentUsage(kv, organizationId);
  const limit = aiLimits ? aiLimits[plan] : AI_GENERATION_LIMITS[plan].monthlyLimit;

  const totalLimit = limit + usage.addOnGenerations;

  return {
    currentMonth: {
      used: usage.usage.total,
      limit: totalLimit,
      planLimit: limit,
      addOnGenerations: usage.addOnGenerations,
      remaining: Math.max(0, totalLimit - usage.usage.total),
      byType: {
        status_generation: usage.usage.status_generation,
        summary_generation: usage.usage.summary_generation,
      },
    },
    plan,
  };
}
