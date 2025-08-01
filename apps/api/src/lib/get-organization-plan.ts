import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { user } from "../db";
import type { Db } from "../db/db";
import { createStripe, syncStripeDataToKV } from "./stripe";

export type UserPlan = "basic" | "startup" | "enterprise";

/**
 * Determine user plan from Stripe subscription data
 */
function getUserPlanFromStripe(
  stripeData: Awaited<ReturnType<typeof syncStripeDataToKV>>,
  stripePriceIds: { basic: string; startup: string; enterprise: string },
): UserPlan {
  if (stripeData.status === "none") {
    return "basic";
  }

  // Map price IDs to plans using environment configuration
  const priceId = stripeData.priceId;
  if (!priceId) return "basic";

  // Match exact price IDs from environment variables
  if (priceId === stripePriceIds.enterprise) {
    return "enterprise";
  }
  if (priceId === stripePriceIds.startup) {
    return "startup";
  }
  if (priceId === stripePriceIds.basic) {
    return "basic";
  }

  // Default to basic if no match (could be old/discontinued price)
  console.warn(`[PLAN] Unknown Stripe price ID: ${priceId}, defaulting to basic plan`);
  return "basic";
}

/**
 * Get organization's plan based on any member's subscription
 * For now, we'll use the organization owner/admin's plan
 */
export async function getOrganizationPlan(
  db: Db,
  stripeSecretKey: string,
  stripeKv: KVNamespace,
  organizationId: string,
  stripePriceIds: { basic: string; startup: string; enterprise: string },
): Promise<{ plan: UserPlan; stripeCustomerId?: string }> {
  // Get organization admins/owners
  const admins = await db.query.member.findMany({
    where: (members, { and, eq, or }) =>
      and(
        eq(members.organizationId, organizationId),
        or(eq(members.role, "admin"), eq(members.role, "owner")),
      ),
    with: { user: true },
    limit: 1,
  });

  if (admins.length === 0) {
    return { plan: "basic" };
  }

  const adminUser = admins[0]?.user;
  if (!adminUser) {
    return { plan: "basic" };
  }

  // Get user's Stripe customer ID - adminUser already includes stripeCustomerId
  const stripeCustomerId = adminUser.stripeCustomerId;

  if (!stripeCustomerId) {
    return { plan: "basic" };
  }

  // Get plan from Stripe
  try {
    const stripe = createStripe(stripeSecretKey);
    const stripeData = await syncStripeDataToKV(stripe, stripeKv, stripeCustomerId);

    if (stripeData.status === "none") {
      return { plan: "basic", stripeCustomerId };
    }

    const plan = getUserPlanFromStripe(stripeData, stripePriceIds);
    return { plan, stripeCustomerId };
  } catch (error) {
    console.error("[ORG PLAN] Error getting plan:", error);
    return { plan: "basic", stripeCustomerId };
  }
}
