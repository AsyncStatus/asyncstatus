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
): Promise<{ plan: UserPlan; stripeCustomerId: string } | null> {
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, organizationId),
  });

  if (!org || !org.stripeCustomerId) {
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

    return { plan, stripeCustomerId: org.stripeCustomerId };
  } catch (error) {
    console.error("[ORG PLAN] Error getting plan:", error);
    return null;
  }
}
