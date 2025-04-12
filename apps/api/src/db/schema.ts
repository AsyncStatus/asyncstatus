import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("email_user_index").on(t.email)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("user_account_id_index").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
  },
  (t) => [index("identifier_verification_index").on(t.identifier)],
);

export const organization = sqliteTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    logo: text("logo"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata"),
  },
  (t) => [index("slug_index").on(t.slug)],
);

export type Organization = typeof organization.$inferSelect;

export const member = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
  },
  (t) => [
    index("organization_member_id_index").on(t.organizationId),
    index("user_member_id_index").on(t.userId),
  ],
);

export const team = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const teamMembership = sqliteTable(
  "team_membership",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("team_members_team_id_index").on(t.teamId),
    index("team_members_member_id_index").on(t.memberId),
  ],
);

export const invitation = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    name: text("name"),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("organization_invitation_id_index").on(t.organizationId),
    index("inviter_invitation_id_index").on(t.inviterId),
  ],
);

export const statusUpdate = sqliteTable(
  "status_update",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
    effectiveTo: integer("effective_to", { mode: "timestamp" }).notNull(),
    mood: text("mood"),
    emoji: text("emoji"),
    isDraft: integer("is_draft", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("status_update_member_id_index").on(t.memberId),
    index("status_update_organization_id_index").on(t.organizationId),
    index("status_update_team_id_index").on(t.teamId),
    index("status_update_created_at_index").on(t.createdAt),
    index("status_update_effective_from_index").on(t.effectiveFrom),
    index("status_update_effective_to_index").on(t.effectiveTo),
    index("status_update_is_draft_index").on(t.isDraft),
  ],
);

export const statusUpdateItem = sqliteTable(
  "status_update_item",
  {
    id: text("id").primaryKey(),
    statusUpdateId: text("status_update_id")
      .notNull()
      .references(() => statusUpdate.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isBlocker: integer("is_blocker", { mode: "boolean" })
      .notNull()
      .default(false),
    order: integer("order").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("status_update_item_update_id_index").on(t.statusUpdateId),
    index("status_update_item_blocker_index").on(t.isBlocker),
  ],
);

export const publicStatusShare = sqliteTable(
  "public_status_share",
  {
    id: text("id").primaryKey(),
    statusUpdateId: text("status_update_id")
      .notNull()
      .references(() => statusUpdate.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("public_share_status_update_id_index").on(t.statusUpdateId),
    index("public_share_organization_id_index").on(t.organizationId),
    index("public_share_slug_index").on(t.slug),
    index("public_share_is_active_index").on(t.isActive),
  ],
);

// Relations section - after all tables are defined
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  teams: many(team),
  invitations: many(invitation),
  publicStatusShares: many(publicStatusShare),
}));

export const memberRelations = relations(member, ({ one, many }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  teamMemberships: many(teamMembership),
  statusUpdates: many(statusUpdate),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMemberships: many(teamMembership),
  statusUpdates: many(statusUpdate),
}));

export const teamMembershipRelations = relations(teamMembership, ({ one }) => ({
  team: one(team, {
    fields: [teamMembership.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [teamMembership.memberId],
    references: [member.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  team: one(team, {
    fields: [invitation.teamId],
    references: [team.id],
  }),
}));

export const statusUpdateRelations = relations(
  statusUpdate,
  ({ one, many }) => ({
    member: one(member, {
      fields: [statusUpdate.memberId],
      references: [member.id],
    }),
    team: one(team, {
      fields: [statusUpdate.teamId],
      references: [team.id],
    }),
    items: many(statusUpdateItem),
    publicShares: many(publicStatusShare),
  }),
);

export const statusUpdateItemRelations = relations(
  statusUpdateItem,
  ({ one }) => ({
    statusUpdate: one(statusUpdate, {
      fields: [statusUpdateItem.statusUpdateId],
      references: [statusUpdate.id],
    }),
  }),
);

export const publicStatusShareRelations = relations(
  publicStatusShare,
  ({ one }) => ({
    statusUpdate: one(statusUpdate, {
      fields: [publicStatusShare.statusUpdateId],
      references: [statusUpdate.id],
    }),
    organization: one(organization, {
      fields: [publicStatusShare.organizationId],
      references: [organization.id],
    }),
  }),
);
