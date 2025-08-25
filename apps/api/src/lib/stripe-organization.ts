import * as schema from "@asyncstatus/db";
import type { Db } from "@asyncstatus/db/create-db";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

type GetOrCreateOrganizationStripeCustomerIdOptions = {
  db: Db;
  stripe: Stripe;
  organizationId: string;
  adminEmail: string;
  adminName: string;
};

export async function getOrCreateOrganizationStripeCustomerId({
  db,
  stripe,
  organizationId,
  adminEmail,
  adminName,
}: GetOrCreateOrganizationStripeCustomerIdOptions): Promise<string> {
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, organizationId),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  async function createCustomer(organizationSlug: string) {
    const customer = await stripe.customers.create({
      email: adminEmail,
      name: adminName,
      metadata: { organizationId, organizationSlug },
    });

    await db
      .update(schema.organization)
      .set({ stripeCustomerId: customer.id })
      .where(eq(schema.organization.id, organizationId));

    return customer.id;
  }

  if (org.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(org.stripeCustomerId);
    if (customer.deleted) {
      return createCustomer(org.slug);
    }
    return org.stripeCustomerId;
  }

  return createCustomer(org.slug);
}
