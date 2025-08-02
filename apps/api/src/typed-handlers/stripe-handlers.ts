import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { syncStripeDataToKV } from "../lib/stripe";
import { getOrCreateOrganizationStripeCustomerId } from "../lib/stripe-organization";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  generateStripeCheckoutContract,
  getSubscriptionContract,
  stripeSuccessContract,
  syncSubscriptionContract,
} from "./stripe-contracts";

export const generateStripeCheckoutHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof generateStripeCheckoutContract
>(
  generateStripeCheckoutContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, stripeConfig, input }) => {
    const { plan, successUrl, cancelUrl, startTrial } = input;

    // Only admins/owners can initiate billing - check via query
    const membership = await db.query.member.findFirst({
      where: (members, { and, eq }) =>
        and(eq(members.organizationId, organization.id), eq(members.userId, session.user.id)),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can manage billing",
      });
    }

    const stripeCustomerId = await getOrCreateOrganizationStripeCustomerId({
      db,
      stripe: stripeClient,
      organizationId: organization.id,
      adminEmail: session.user.email,
      organizationName: organization.name,
    });

    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url:
        successUrl ||
        `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=cancelled`,
      line_items: [{ price: stripeConfig.priceIds[plan], quantity: 1 }],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      metadata: {
        organizationId: organization.id,
        organizationSlug: organization.slug,
        planType: startTrial ? "trial" : "paid",
        plan: plan,
      },
    };

    if (startTrial) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      checkoutSessionParams.subscription_data = {
        trial_end: Math.floor(trialEnd.getTime() / 1000), // Stripe expects Unix timestamp
      };
      checkoutSessionParams.metadata!.isTrialSignup = "true";
    }

    const checkout = await stripeClient.checkout.sessions.create(checkoutSessionParams);

    if (!checkout.url) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create checkout session",
      });
    }

    let trialEndDate: string | undefined;
    if (startTrial) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);
      trialEndDate = endDate.toISOString();
    }

    return {
      checkoutUrl: checkout.url,
      ...(trialEndDate && { trialEndDate }),
    };
  },
);

export const stripeSuccessHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof stripeSuccessContract
>(
  stripeSuccessContract,
  requiredSession,
  requiredOrganization,
  async ({ db, input, organization, stripeClient, stripeConfig }) => {
    const { sessionId } = input;

    if (!sessionId) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Session ID is required",
      });
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Checkout session not found",
      });
    }

    if (session.payment_status !== "paid") {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Payment not completed",
      });
    }

    // Verify this session belongs to the current organization
    if (session.metadata?.organizationId !== organization.id) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "This payment session does not belong to your organization",
      });
    }

    // Update organization with Stripe customer ID if not already set
    if (session.customer && typeof session.customer === "string") {
      const org = await db.query.organization.findFirst({
        where: eq(schema.organization.id, organization.id),
      });

      if (!org?.stripeCustomerId) {
        await db
          .update(schema.organization)
          .set({ stripeCustomerId: session.customer })
          .where(eq(schema.organization.id, organization.id));
      }

      // Trial conversion is handled automatically by Stripe
      // The subscription status will change from "trialing" to "active" in Stripe

      // Sync the latest subscription data to KV
      await syncStripeDataToKV(stripeClient, stripeConfig.kv, session.customer);
    }

    return {
      success: true,
      paymentStatus: session.payment_status,
    };
  },
);

export const getSubscriptionHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getSubscriptionContract
>(
  getSubscriptionContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, stripeClient, stripeConfig }) => {
    // Get organization's Stripe customer ID
    const org = await db.query.organization.findFirst({
      where: (orgs, { eq }) => eq(orgs.id, organization.id),
    });

    if (!org?.stripeCustomerId) {
      return null;
    }

    const stripeData = await syncStripeDataToKV(
      stripeClient,
      stripeConfig.kv,
      org.stripeCustomerId,
    );

    return stripeData;
  },
);

export const syncSubscriptionHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof syncSubscriptionContract
>(
  syncSubscriptionContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, stripeConfig }) => {
    // Only admins/owners can sync subscription - check via query
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can sync subscription",
      });
    }

    // Get organization's Stripe customer ID
    const org = await db.query.organization.findFirst({
      where: eq(schema.organization.id, organization.id),
    });

    if (!org?.stripeCustomerId) {
      return null;
    }

    const stripeData = await syncStripeDataToKV(
      stripeClient,
      stripeConfig.kv,
      org.stripeCustomerId,
    );

    return stripeData;
  },
);
