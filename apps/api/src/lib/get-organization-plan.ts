import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import * as schema from "../db";
import type { Db } from "../db/db";
import { syncStripeDataToKV } from "./stripe";

export type UserPlan = "basic" | "startup" | "enterprise";

export function getPlanFromStripeData(
  stripeData: Awaited<ReturnType<typeof syncStripeDataToKV>>,
  stripePriceIds: { basic: string; startup: string; enterprise: string },
): UserPlan | null {
  if (!stripeData) {
    return null;
  }

  const priceId = stripeData.priceId;
  if (!priceId) return null;

  if (priceId === stripePriceIds.enterprise) {
    return "enterprise";
  }
  if (priceId === stripePriceIds.startup) {
    return "startup";
  }
  if (priceId === stripePriceIds.basic) {
    return "basic";
  }

  return null;
}

export async function getOrganizationPlan(
  db: Db,
  stripe: Stripe,
  stripeKv: KVNamespace,
  organizationId: string,
  stripePriceIds: { basic: string; startup: string; enterprise: string },
): Promise<{
  plan: UserPlan;
  source: "trial" | "subscription";
  stripeCustomerId?: string;
  trialEndDate?: Date;
} | null> {
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, organizationId),
  });

  if (!org) {
    return null;
  }

  // First check if there's an active trial
  if (org.trialStatus === "active" && org.trialPlan && org.trialEndDate) {
    const now = new Date();
    const trialEnd = new Date(org.trialEndDate);

    if (now <= trialEnd) {
      return {
        plan: org.trialPlan as UserPlan,
        source: "trial",
        trialEndDate: trialEnd,
      };
    } else {
      // Trial has expired, update status
      await db
        .update(schema.organization)
        .set({ trialStatus: "expired" })
        .where(eq(schema.organization.id, organizationId));
    }
  }

  // If no active trial, check Stripe subscription
  if (!org.stripeCustomerId) {
    return null;
  }

  try {
    const stripeData = await syncStripeDataToKV(stripe, stripeKv, org.stripeCustomerId);
    if (!stripeData) {
      return null;
    }

    const plan = getPlanFromStripeData(stripeData, stripePriceIds);
    if (!plan) {
      return null;
    }

    return {
      plan,
      source: "subscription",
      stripeCustomerId: org.stripeCustomerId,
    };
  } catch (error) {
    console.error("[ORG PLAN] Error getting plan:", error);
    return null;
  }
}

/**
 * Start a trial for an organization (always on "basic" plan)
 */
export async function startOrganizationTrial(
  db: Db,
  organizationId: string,
  trialDurationDays: number = 14,
): Promise<{ success: boolean; trialEndDate?: Date }> {
  try {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + trialDurationDays);

    await db
      .update(schema.organization)
      .set({
        trialPlan: "basic", // Custom trials are always on basic plan
        trialStartDate: now,
        trialEndDate: trialEnd,
        trialStatus: "active",
      })
      .where(eq(schema.organization.id, organizationId));

    return { success: true, trialEndDate: trialEnd };
  } catch (error) {
    console.error("[START TRIAL] Error starting trial:", error);
    return { success: false };
  }
}

/**
 * Check if organization is eligible for a trial
 */
export async function isEligibleForTrial(db: Db, organizationId: string): Promise<boolean> {
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, organizationId),
  });

  if (!org) {
    return false;
  }

  // Organization is eligible if:
  // 1. Never had a trial before (trialStatus is null)
  // 2. Or trial was cancelled (can give another chance)
  // 3. And no active Stripe subscription
  const neverHadTrial = !org.trialStatus;
  const trialWasCancelled = org.trialStatus === "cancelled";
  const noActiveSubscription = !org.stripeCustomerId;

  return (neverHadTrial || trialWasCancelled) && noActiveSubscription;
}
