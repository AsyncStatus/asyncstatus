import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import * as schema from "../db";
import type { Db } from "../db/db";

type GetOrCreateOrganizationStripeCustomerIdOptions = {
  db: Db;
  stripe: Stripe;
  organizationId: string;
  adminEmail: string;
  organizationName: string;
};

export async function getOrCreateOrganizationStripeCustomerId({
  db,
  stripe,
  organizationId,
  adminEmail,
  organizationName,
}: GetOrCreateOrganizationStripeCustomerIdOptions): Promise<string> {
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, organizationId),
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  if (org.stripeCustomerId) {
    return org.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: adminEmail,
    name: organizationName,
    metadata: {
      organizationId,
      organizationSlug: org.slug,
    },
  });

  await db
    .update(schema.organization)
    .set({ stripeCustomerId: customer.id })
    .where(eq(schema.organization.id, organizationId));

  return customer.id;
}
