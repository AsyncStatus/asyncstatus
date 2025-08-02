import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import * as schema from "../db";
import { getUsageStats } from "../lib/ai-usage-kv";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getOrganizationPlan } from "../lib/get-organization-plan";
import { syncStripeDataToKV } from "../lib/stripe";
import { getOrCreateOrganizationStripeCustomerId } from "../lib/stripe-organization";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  cancelStripeSubscriptionContract,
  createPortalSessionContract,
  generateStripeCheckoutContract,
  getSubscriptionContract,
  reactivateStripeSubscriptionContract,
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
    const { plan, successUrl, cancelUrl } = input;

    // Only admins/owners can initiate billing - check via query
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
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
      adminName: session.user.name,
    });

    const customer = await stripeClient.customers.retrieve(stripeCustomerId);
    if (customer.deleted || customer.id !== stripeCustomerId) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You are not authorized to manage this organization's billing.",
      });
    }

    // Check if customer already has an active subscription
    const existingSubscriptions = await stripeClient.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    const targetPriceId = stripeConfig.priceIds[plan];

    // If customer has an active subscription, update it instead of creating new checkout
    if (existingSubscriptions.data.length > 0) {
      const existingSubscription = existingSubscriptions.data[0];

      if (!existingSubscription) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve existing subscription",
        });
      }

      const subscriptionItem = existingSubscription.items.data[0];
      if (!subscriptionItem) {
        throw new TypedHandlersError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid subscription structure",
        });
      }

      const currentPriceId = subscriptionItem.price.id;

      // If they're already on the target plan, return success without changes
      if (currentPriceId === targetPriceId) {
        return {
          checkoutUrl: `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=success&message=${encodeURIComponent(
            "You're already subscribed to this plan.",
          )}`,
        };
      }

      // Get price details to determine if this is an upgrade or downgrade
      const [currentPrice, targetPrice] = await Promise.all([
        stripeClient.prices.retrieve(currentPriceId),
        stripeClient.prices.retrieve(targetPriceId),
      ]);

      const currentAmount = currentPrice.unit_amount || 0;
      const targetAmount = targetPrice.unit_amount || 0;
      const isUpgrade = targetAmount > currentAmount;
      const isDowngrade = targetAmount < currentAmount;

      const baseMetadata = {
        ...(existingSubscription.metadata || {}),
        organizationId: organization.id,
        organizationSlug: organization.slug,
        plan: plan,
        plan_changed_by: session.user.email,
        plan_changed_at: new Date().toISOString(),
        previous_plan: currentPriceId || "unknown",
        change_type: isUpgrade ? "upgrade" : isDowngrade ? "downgrade" : "lateral",
      };

      let successMessage: string;

      if (isUpgrade) {
        // For upgrades: immediate change with prorated billing
        await stripeClient.subscriptions.update(existingSubscription.id, {
          items: [{ id: subscriptionItem.id, price: targetPriceId }],
          proration_behavior: "always_invoice", // Customer pays difference immediately
          metadata: baseMetadata,
          cancel_at_period_end: false,
        });
        successMessage =
          "Your plan has been upgraded! You'll be charged the prorated difference immediately.";
      } else if (isDowngrade) {
        // For downgrades: immediate change with proration (creates account credits)
        // This is a common and acceptable approach - credits are applied to future invoices
        await stripeClient.subscriptions.update(existingSubscription.id, {
          items: [{ id: subscriptionItem.id, price: targetPriceId }],
          proration_behavior: "always_invoice", // Creates credits for the difference
          metadata: baseMetadata,
          cancel_at_period_end: false,
        });
        successMessage =
          "Your plan has been downgraded! Account credits for the difference will be applied to your next invoice.";
      } else {
        // Lateral move (same price): immediate change, no proration needed
        await stripeClient.subscriptions.update(existingSubscription.id, {
          items: [{ id: subscriptionItem.id, price: targetPriceId }],
          proration_behavior: "none", // No billing changes
          metadata: baseMetadata,
          cancel_at_period_end: false,
        });
        successMessage = "Your plan has been updated successfully with no billing changes.";
      }

      await syncStripeDataToKV(stripeClient, stripeConfig.kv, stripeCustomerId);

      return {
        checkoutUrl: `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=success&message=${encodeURIComponent(successMessage)}`,
      };
    }

    // No existing subscription, create new checkout session
    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      success_url:
        successUrl ||
        `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl || `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=cancelled`,
      line_items: [{ price: targetPriceId, quantity: 1 }],
      mode: "subscription",
      billing_address_collection: "auto",
      client_reference_id: organization.id,
      customer_update: { address: "auto", name: "auto" },
      metadata: {
        organizationId: organization.id,
        organizationSlug: organization.slug,
        plan: plan,
      },
    };

    const checkout = await stripeClient.checkout.sessions.create(checkoutSessionParams);

    if (!checkout.url) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create checkout session",
      });
    }

    return {
      checkoutUrl: checkout.url,
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
  async ({ db, input, organization, stripeClient, stripeConfig, redirect }) => {
    const { sessionId } = input;

    if (!sessionId) {
      return redirect(
        `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=error&error=${encodeURIComponent(
          "No session ID",
        )}`,
      );
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return redirect(
        `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=error&error=${encodeURIComponent(
          "No session found",
        )}`,
      );
    }

    if (session.payment_status !== "paid") {
      return redirect(
        `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=error&error=${encodeURIComponent(
          "Payment not successful",
        )}`,
      );
    }

    // Verify this session belongs to the current organization
    if (session.metadata?.organizationId !== organization.id) {
      return redirect(
        `${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=error&error=${encodeURIComponent(
          "Session does not belong to this organization",
        )}`,
      );
    }

    // Update organization with Stripe customer ID if not already set
    if (session.customer && typeof session.customer === "string") {
      const org = await db.query.organization.findFirst({
        where: eq(schema.organization.id, organization.id),
      });

      const updateData: {
        stripeCustomerId?: string;
        trialPlan?: null;
        trialStartDate?: null;
        trialEndDate?: null;
        trialStatus?: "converted";
      } = {};

      if (!org?.stripeCustomerId) {
        updateData.stripeCustomerId = session.customer;
      }

      // Clear trial data when converting to paid subscription
      if (org?.trialStatus === "active") {
        updateData.trialPlan = null;
        updateData.trialStartDate = null;
        updateData.trialEndDate = null;
        updateData.trialStatus = "converted";
      }

      // Only update if there are changes to make
      if (Object.keys(updateData).length > 0) {
        await db
          .update(schema.organization)
          .set(updateData)
          .where(eq(schema.organization.id, organization.id));
      }

      // Trial conversion is handled automatically by Stripe
      // The subscription status will change from "trialing" to "active" in Stripe

      // Sync the latest subscription data to KV
      await syncStripeDataToKV(stripeClient, stripeConfig.kv, session.customer);
    }

    return redirect(`${process.env.WEB_APP_URL}/${organization.slug}/billing?payment=success`);
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
    // Get organization data including trial information
    const org = await db.query.organization.findFirst({
      where: (orgs, { eq }) => eq(orgs.id, organization.id),
    });

    if (!org) {
      return null;
    }

    // Get organization's plan and usage information
    const orgPlan = await getOrganizationPlan(
      db,
      stripeClient,
      stripeConfig.kv,
      organization.id,
      stripeConfig.priceIds,
    );

    let usage = null;
    if (orgPlan) {
      const usageStats = await getUsageStats(
        stripeConfig.kv,
        organization.id,
        orgPlan.plan,
        stripeConfig.aiLimits,
      );

      usage = {
        currentMonth: usageStats.currentMonth,
        plan: orgPlan.plan,
      };
    }

    // Check for active trial first
    if (org.trialStatus === "active" && org.trialPlan && org.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(org.trialEndDate);

      if (now <= trialEnd) {
        // Return trial information
        return {
          subscriptionId: null,
          status: "trialing" as const,
          priceId: null,
          planName: org.trialPlan as "basic" | "startup" | "enterprise",
          currentPeriodStart: org.trialStartDate
            ? Math.floor(new Date(org.trialStartDate).getTime() / 1000)
            : null,
          currentPeriodEnd: Math.floor(trialEnd.getTime() / 1000),
          cancelAtPeriodEnd: false,
          trialEnd: Math.floor(trialEnd.getTime() / 1000),
          trialStart: org.trialStartDate
            ? Math.floor(new Date(org.trialStartDate).getTime() / 1000)
            : null,
          paymentMethod: null,
          customTrial: {
            plan: org.trialPlan as "basic" | "startup" | "enterprise",
            startDate: org.trialStartDate
              ? Math.floor(new Date(org.trialStartDate).getTime() / 1000)
              : Math.floor(now.getTime() / 1000),
            endDate: Math.floor(trialEnd.getTime() / 1000),
            status: "active" as const,
          },
          planSource: "trial" as const,
          usage,
        };
      } else {
        // Trial has expired, update status
        await db
          .update(schema.organization)
          .set({ trialStatus: "expired" })
          .where(eq(schema.organization.id, organization.id));
      }
    }

    // If no active trial or trial expired, check Stripe subscription
    if (!org.stripeCustomerId) {
      return null;
    }

    const stripeData = await syncStripeDataToKV(
      stripeClient,
      stripeConfig.kv,
      org.stripeCustomerId,
    );

    if (!stripeData) {
      return null;
    }

    // Map price ID to plan name
    let planName: "basic" | "startup" | "enterprise" | null = null;
    if (stripeData.priceId) {
      if (stripeData.priceId === stripeConfig.priceIds.basic) {
        planName = "basic";
      } else if (stripeData.priceId === stripeConfig.priceIds.startup) {
        planName = "startup";
      } else if (stripeData.priceId === stripeConfig.priceIds.enterprise) {
        planName = "enterprise";
      }
    }

    return {
      ...stripeData,
      planName,
      customTrial: null,
      planSource: "subscription" as const,
      usage,
    };
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

    // Get organization data including trial information
    const org = await db.query.organization.findFirst({
      where: eq(schema.organization.id, organization.id),
    });

    if (!org) {
      return null;
    }

    // Check for active trial first
    if (org.trialStatus === "active" && org.trialPlan && org.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(org.trialEndDate);

      if (now <= trialEnd) {
        // Return trial information
        return {
          subscriptionId: null,
          status: "trialing" as const,
          priceId: null,
          planName: org.trialPlan as "basic" | "startup" | "enterprise",
          currentPeriodStart: org.trialStartDate
            ? Math.floor(new Date(org.trialStartDate).getTime() / 1000)
            : null,
          currentPeriodEnd: Math.floor(trialEnd.getTime() / 1000),
          cancelAtPeriodEnd: false,
          trialEnd: Math.floor(trialEnd.getTime() / 1000),
          trialStart: org.trialStartDate
            ? Math.floor(new Date(org.trialStartDate).getTime() / 1000)
            : null,
          paymentMethod: null,
          customTrial: {
            plan: org.trialPlan as "basic" | "startup" | "enterprise",
            startDate: org.trialStartDate
              ? Math.floor(new Date(org.trialStartDate).getTime() / 1000)
              : Math.floor(now.getTime() / 1000),
            endDate: Math.floor(trialEnd.getTime() / 1000),
            status: "active" as const,
          },
          planSource: "trial" as const,
        };
      } else {
        // Trial has expired, update status
        await db
          .update(schema.organization)
          .set({ trialStatus: "expired" })
          .where(eq(schema.organization.id, organization.id));
      }
    }

    // If no active trial or trial expired, check Stripe subscription
    if (!org.stripeCustomerId) {
      return null;
    }

    const stripeData = await syncStripeDataToKV(
      stripeClient,
      stripeConfig.kv,
      org.stripeCustomerId,
    );

    if (!stripeData) {
      return null;
    }

    // Map price ID to plan name
    let planName: "basic" | "startup" | "enterprise" | null = null;
    if (stripeData.priceId) {
      if (stripeData.priceId === stripeConfig.priceIds.basic) {
        planName = "basic";
      } else if (stripeData.priceId === stripeConfig.priceIds.startup) {
        planName = "startup";
      } else if (stripeData.priceId === stripeConfig.priceIds.enterprise) {
        planName = "enterprise";
      }
    }

    return {
      ...stripeData,
      planName,
      customTrial: null,
      planSource: "subscription" as const,
    };
  },
);

export const createPortalSessionHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof createPortalSessionContract
>(
  createPortalSessionContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, input, redirect }) => {
    const { returnUrl } = input;

    // Only admins/owners can access billing portal - check via query
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can access billing portal",
      });
    }

    // Get organization to check for Stripe customer ID
    const org = await db.query.organization.findFirst({
      where: eq(schema.organization.id, organization.id),
    });

    if (!org?.stripeCustomerId) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Organization does not have a Stripe customer ID",
      });
    }

    // Create portal session
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: returnUrl || `${process.env.WEB_APP_URL}/${organization.slug}/billing`,
    });

    return redirect(portalSession.url);
  },
);

export const cancelStripeSubscriptionHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof cancelStripeSubscriptionContract
>(
  cancelStripeSubscriptionContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, input }) => {
    const { reason, feedback } = input;

    // Only admins/owners can cancel subscription - check via query
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can cancel subscription",
      });
    }

    // Get organization to check for Stripe customer ID
    const org = await db.query.organization.findFirst({
      where: eq(schema.organization.id, organization.id),
    });

    if (!org?.stripeCustomerId) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Organization does not have a Stripe customer ID",
      });
    }

    // Get the current subscription
    const subscriptions = await stripeClient.subscriptions.list({
      customer: org.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "No active subscription found",
      });
    }

    const subscription = subscriptions.data[0];
    if (!subscription) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "No subscription found",
      });
    }

    // Prepare metadata for Stripe
    const metadata: Record<string, string> = {
      ...(subscription.metadata || {}),
      cancellation_reason: reason,
      cancelled_by: session.user.email,
      cancelled_at: new Date().toISOString(),
      organization_id: organization.id,
    };

    if (feedback) {
      metadata.cancellation_feedback = feedback;
    }

    // Map our reasons to Stripe's feedback types
    let stripeFeedback:
      | "other"
      | "low_quality"
      | "missing_features"
      | "unused"
      | "customer_service"
      | "too_expensive" = "other";
    if (
      ["low_quality", "missing_features", "unused", "customer_service", "too_expensive"].includes(
        reason,
      )
    ) {
      stripeFeedback = reason as typeof stripeFeedback;
    }

    // Cancel the subscription at period end with reason
    await stripeClient.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      metadata,
      cancellation_details: {
        comment: feedback || `Cancelled due to: ${reason}`,
        feedback: stripeFeedback,
      },
    });

    return {
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
    };
  },
);

export const reactivateStripeSubscriptionHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof reactivateStripeSubscriptionContract
>(
  reactivateStripeSubscriptionContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, stripeConfig }) => {
    // Only admins/owners can reactivate subscription - check via query
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can reactivate subscription",
      });
    }

    // Get organization to check for Stripe customer ID
    const org = await db.query.organization.findFirst({
      where: eq(schema.organization.id, organization.id),
    });

    if (!org?.stripeCustomerId) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Organization does not have a Stripe customer ID",
      });
    }

    // Get the subscription that's set to cancel
    const subscriptions = await stripeClient.subscriptions.list({
      customer: org.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "No active subscription found",
      });
    }

    const subscription = subscriptions.data[0];
    if (!subscription) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "No subscription found",
      });
    }

    // Check if subscription is actually set to cancel
    if (!subscription.cancel_at_period_end) {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Subscription is not set to cancel",
      });
    }

    // Reactivate the subscription by setting cancel_at_period_end to false
    const updatedMetadata = {
      ...(subscription.metadata || {}),
      reactivated_by: session.user.email,
      reactivated_at: new Date().toISOString(),
    };

    await stripeClient.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      metadata: updatedMetadata,
    });

    // Sync the updated subscription data to KV
    await syncStripeDataToKV(stripeClient, stripeConfig.kv, org.stripeCustomerId);

    return {
      success: true,
      message:
        "Subscription has been reactivated and will continue after the current billing period",
    };
  },
);
