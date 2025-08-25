import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";
import type { ExecutionContext } from "hono";
import type Stripe from "stripe";
import { getCurrentUsage, getUsageKvKey } from "./ai-usage-kv";
import { ALLOWED_STRIPE_EVENTS, syncStripeDataToKV } from "./stripe";

type ProcessStripeEventOptions = {
  stripe: Stripe;
  db: Db;
  kv: KVNamespace;
  event: Stripe.Event;
};

export async function processStripeEvent({
  stripe,
  db,
  kv,
  event,
}: ProcessStripeEventOptions): Promise<void> {
  // Skip processing if the event isn't one we're tracking
  if (!ALLOWED_STRIPE_EVENTS.includes(event.type)) {
    console.log(`[STRIPE WEBHOOK] Ignoring event type: ${event.type}`);
    return;
  }

  // Handle additional generation purchases via Payment Intent
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { type, organizationId, generationsToAdd } = paymentIntent.metadata || {};

    if (type === "additional_generations" && organizationId && generationsToAdd) {
      const addGenerations = parseInt(generationsToAdd, 10);

      // Update the organization's AI usage
      const usage = await getCurrentUsage(kv, organizationId);
      usage.addOnGenerations += addGenerations;
      usage.lastUpdated = new Date().toISOString();

      const key = getUsageKvKey(organizationId);
      await kv.put(key, JSON.stringify(usage));

      console.log(
        `[STRIPE WEBHOOK] Added ${addGenerations} generations to org ${organizationId} via payment intent ${paymentIntent.id}`,
      );
    }
  }

  // All other events we track have a customerId
  const { customer: customerId } = event?.data?.object as {
    customer: string; // Sadly TypeScript does not know this
  };

  // This helps make it typesafe and also lets us know if our assumption is wrong
  if (typeof customerId !== "string") {
    throw new Error(`[STRIPE WEBHOOK][ERROR] Customer ID isn't string.\nEvent type: ${event.type}`);
  }

  if (event.type === "customer.deleted") {
    const { organizationId } = event.data.object.metadata;

    if (!organizationId) {
      throw new Error(
        `[STRIPE WEBHOOK][ERROR] Organization ID isn't set.\nEvent type: ${event.type}`,
      );
    }
    await db
      .update(schema.organization)
      .set({ stripeCustomerId: null })
      .where(eq(schema.organization.id, organizationId));
  }

  if (event.type === "customer.created" || event.type === "customer.updated") {
    const { organizationId } = event.data.object.metadata;

    if (!organizationId) {
      throw new Error(
        `[STRIPE WEBHOOK][ERROR] Organization ID isn't set.\nEvent type: ${event.type}`,
      );
    }
    await db
      .update(schema.organization)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.organization.id, organizationId));
  }

  await syncStripeDataToKV(stripe, kv, customerId);
}

type HandleStripeWebhookOptions = {
  stripe: Stripe;
  db: Db;
  webhookSecret: string;
  kv: KVNamespace;
  body: string;
  signature: string;
  executionCtx: ExecutionContext;
};

export async function handleStripeWebhook({
  stripe,
  db,
  webhookSecret,
  kv,
  body,
  signature,
  executionCtx,
}: HandleStripeWebhookOptions): Promise<{ success: boolean; error?: string }> {
  let event: Stripe.Event | null = null;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Error constructing event:", error);
    return { success: false, error: "Invalid webhook signature" };
  }

  try {
    executionCtx.waitUntil(processStripeEvent({ stripe, db, kv, event }));
  } catch (error) {
    console.error("[STRIPE WEBHOOK] Error processing event:", error);
    return { success: false, error: "Failed to process webhook" };
  }

  console.log(`[STRIPE WEBHOOK] Successfully processed event: ${event.type}`);
  return { success: true };
}
