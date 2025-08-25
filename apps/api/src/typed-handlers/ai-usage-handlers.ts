import * as schema from "@asyncstatus/db";
import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, eq } from "drizzle-orm";
import { getCurrentUsage, getUsageKvKey } from "../lib/ai-usage-kv";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { getOrCreateOrganizationStripeCustomerId } from "../lib/stripe-organization";
import {
  confirmAdditionalGenerationsPaymentContract,
  purchaseAdditionalGenerationsContract,
} from "./ai-usage-contracts";
import { requiredOrganization, requiredSession } from "./middleware";

export const purchaseAdditionalGenerationsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof purchaseAdditionalGenerationsContract
>(
  purchaseAdditionalGenerationsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, stripeConfig, input }) => {
    const { idOrSlug: _idOrSlug, option, paymentMethodId } = input;

    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can purchase additional generations",
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

    // Get the price ID based on the option
    const priceId =
      option === "add_25"
        ? stripeConfig.priceIds.add25Generations
        : stripeConfig.priceIds.add100Generations;

    // Get the price details to determine the amount
    const price = await stripeClient.prices.retrieve(priceId);
    if (!price.unit_amount) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Price configuration error",
      });
    }

    // Determine the payment method to use
    let paymentMethod = paymentMethodId;
    if (!paymentMethod) {
      // Get the customer's default payment method from their active subscription
      const subscriptions = await stripeClient.subscriptions.list({
        customer: stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        paymentMethod = (subscription?.default_payment_method as string) || undefined;
      }

      if (!paymentMethod) {
        throw new TypedHandlersError({
          code: "BAD_REQUEST",
          message: "No payment method available. Please add a payment method first.",
        });
      }
    }

    const generationsToAdd = option === "add_25" ? 25 : 100;

    // Create and confirm payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: stripeCustomerId,
      payment_method: paymentMethod,
      confirmation_method: "automatic",
      confirm: true,
      metadata: {
        organizationId: organization.id,
        organizationSlug: organization.slug,
        generationOption: option,
        type: "additional_generations",
        generationsToAdd: generationsToAdd.toString(),
      },
      return_url: `${process.env.WEB_APP_URL}/${organization.slug}/billing`,
    });

    // Handle the payment result
    if (paymentIntent.status === "succeeded") {
      // Payment succeeded immediately, add generations right away
      const usage = await getCurrentUsage(stripeConfig.kv, organization.id);
      usage.addOnGenerations += generationsToAdd;
      usage.lastUpdated = new Date().toISOString();

      const key = getUsageKvKey(organization.id);
      await stripeConfig.kv.put(key, JSON.stringify(usage));

      console.log(
        `[AI USAGE] Added ${generationsToAdd} generations to org ${organization.id} via immediate payment`,
      );

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        generationsAdded: generationsToAdd,
      };
    } else if (paymentIntent.status === "requires_action") {
      // Payment requires additional authentication (3D Secure)
      return {
        success: false,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        generationsAdded: 0,
      };
    } else {
      // Payment failed
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: `Payment failed: ${paymentIntent.status}`,
      });
    }
  },
);

export const confirmAdditionalGenerationsPaymentHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof confirmAdditionalGenerationsPaymentContract
>(
  confirmAdditionalGenerationsPaymentContract,
  requiredSession,
  requiredOrganization,
  async ({ db, session, organization, stripeClient, stripeConfig, input }) => {
    const { idOrSlug: _idOrSlug, paymentIntentId } = input;

    // Only admins/owners can confirm additional generation payments - check via query
    const membership = await db.query.member.findFirst({
      where: and(
        eq(schema.member.organizationId, organization.id),
        eq(schema.member.userId, session.user.id),
      ),
    });

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Only admins and owners can confirm additional generation payments",
      });
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    // Verify this payment intent belongs to the current organization
    if (paymentIntent.metadata?.organizationId !== organization.id) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "Payment intent does not belong to this organization",
      });
    }

    // Verify this is for additional generations
    if (paymentIntent.metadata?.type !== "additional_generations") {
      throw new TypedHandlersError({
        code: "BAD_REQUEST",
        message: "Payment intent is not for additional generations",
      });
    }

    if (paymentIntent.status === "succeeded") {
      // Payment has succeeded, add the generations
      const generationsToAdd = parseInt(paymentIntent.metadata?.generationsToAdd || "0", 10);

      if (generationsToAdd > 0) {
        const usage = await getCurrentUsage(stripeConfig.kv, organization.id);
        usage.addOnGenerations += generationsToAdd;
        usage.lastUpdated = new Date().toISOString();

        const key = getUsageKvKey(organization.id);
        await stripeConfig.kv.put(key, JSON.stringify(usage));

        console.log(
          `[AI USAGE] Added ${generationsToAdd} generations to org ${organization.id} via confirmed payment ${paymentIntentId}`,
        );

        return {
          success: true,
          generationsAdded: generationsToAdd,
          status: paymentIntent.status,
        };
      }
    }

    return {
      success: paymentIntent.status === "succeeded",
      generationsAdded: 0,
      status: paymentIntent.status,
    };
  },
);
