import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";

export const organization = sqliteTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    logo: text("logo"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata"),
    stripeCustomerId: text("stripe_customer_id"),
    trialPlan: text("trial_plan", { enum: ["basic", "startup", "enterprise"] }),
    trialStartDate: integer("trial_start_date", { mode: "timestamp" }),
    trialEndDate: integer("trial_end_date", { mode: "timestamp" }),
    trialStatus: text("trial_status", { enum: ["active", "expired", "converted", "cancelled"] }),
  },
  (t) => [index("slug_index").on(t.slug)],
);

export const Organization = createSelectSchema(organization, {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});
export type Organization = z.output<typeof Organization>;
export const OrganizationInsert = createInsertSchema(organization, {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});
export type OrganizationInsert = z.output<typeof OrganizationInsert>;
export const OrganizationUpdate = createUpdateSchema(organization, {
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
});
export type OrganizationUpdate = z.output<typeof OrganizationUpdate>;
