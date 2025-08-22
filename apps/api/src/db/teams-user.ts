import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod/v4";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "./common";
import { teamsIntegration } from "./teams-integration";

export const teamsUser = sqliteTable(
  "teams_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => teamsIntegration.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().unique(), // Azure AD user ID
    displayName: text("display_name").notNull(),
    email: text("email"),
    userPrincipalName: text("user_principal_name"), // UPN in Azure AD
    givenName: text("given_name"),
    surname: text("surname"),
    jobTitle: text("job_title"),
    department: text("department"),
    officeLocation: text("office_location"),
    mobilePhone: text("mobile_phone"),
    businessPhones: text("business_phones"), // JSON array as string
    isGuest: integer("is_guest", { mode: "boolean" }).notNull().default(false),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    tenantId: text("tenant_id"), // Azure AD tenant ID
    roles: text("roles"), // Comma-separated roles in Teams
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("teams_user_integration_id_index").on(t.integrationId),
    index("teams_user_user_id_index").on(t.userId),
    index("teams_user_email_index").on(t.email),
    index("teams_user_upn_index").on(t.userPrincipalName),
  ],
);

export const TeamsUser = createSelectSchema(teamsUser);
export type TeamsUser = z.output<typeof TeamsUser>;
export const TeamsUserInsert = createInsertSchema(teamsUser);
export type TeamsUserInsert = z.output<typeof TeamsUserInsert>;
export const TeamsUserUpdate = createUpdateSchema(teamsUser);
export type TeamsUserUpdate = z.output<typeof TeamsUserUpdate>;