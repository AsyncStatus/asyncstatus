import type Stripe from "stripe";
import { ALLOWED_STRIPE_EVENTS, createStripe, syncStripeDataToKV, tryCatch } from "./stripe";

export async function processStripeEvent(
  secretKey: string,
  kv: KVNamespace,
  event: Stripe.Event,
): Promise<void> {
  // Skip processing if the event isn't one we're tracking
  if (!ALLOWED_STRIPE_EVENTS.includes(event.type)) {
    console.log(`[STRIPE WEBHOOK] Ignoring event type: ${event.type}`);
    return;
  }

  // All the events we track have a customerId
  const { customer: customerId } = event?.data?.object as {
    customer: string; // Sadly TypeScript does not know this
  };

  // This helps make it typesafe and also lets us know if our assumption is wrong
  if (typeof customerId !== "string") {
    throw new Error(`[STRIPE WEBHOOK][ERROR] Customer ID isn't string.\nEvent type: ${event.type}`);
  }

  const stripe = createStripe(secretKey);
  await syncStripeDataToKV(stripe, kv, customerId);
}

export async function handleStripeWebhook(
  secretKey: string,
  webhookSecret: string,
  kv: KVNamespace,
  body: string,
  signature: string,
): Promise<{ success: boolean; error?: string }> {
  const stripe = createStripe(secretKey);

  const { result: event, error: constructError } = await tryCatch(async () => {
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
  });

  if (constructError || !event) {
    console.error("[STRIPE WEBHOOK] Error constructing event:", constructError);
    return { success: false, error: "Invalid webhook signature" };
  }

  const { error: processError } = await tryCatch(async () => {
    await processStripeEvent(secretKey, kv, event);
  });

  if (processError) {
    console.error("[STRIPE WEBHOOK] Error processing event:", processError);
    return { success: false, error: "Failed to process webhook" };
  }

  console.log(`[STRIPE WEBHOOK] Successfully processed event: ${event.type}`);
  return { success: true };
}
