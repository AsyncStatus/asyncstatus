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

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  organizations: many(organization),
  members: many(member),
  invitations: many(invitation),
}));

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

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

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
    slug: text("slug").unique(),
    logo: text("logo"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    metadata: text("metadata"),
  },
  (t) => [index("slug_index").on(t.slug)],
);

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  teams: many(team),
  invitations: many(invitation),
}));

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
  },
  (t) => [
    index("organization_member_id_index").on(t.organizationId),
    index("user_member_id_index").on(t.userId),
  ],
);

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
}));

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
    teamId: text("team_id"),
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

export const team = sqliteTable("team", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMemberships: many(teamMembership),
}));

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

// Slack tables
export const slackWorkspace = sqliteTable("slack_workspace", {
  id: text("id").primaryKey(),
  teamId: text("team_id").notNull(),
  teamName: text("team_name").notNull(),
  botUserId: text("bot_user_id").notNull(),
  botAccessToken: text("bot_access_token").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const slackIntegration = sqliteTable("slack_integration", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  slackWorkspaceId: text("slack_workspace_id").notNull().references(() => slackWorkspace.id, { onDelete: "cascade" }),
  createdById: text("created_by_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  settings: text("settings", { mode: "json" }),
});

export const slackWorkspaceRelations = relations(slackWorkspace, ({ many }) => ({
  integrations: many(slackIntegration),
}));

export const slackIntegrationRelations = relations(slackIntegration, ({ one }) => ({
  organization: one(organization, {
    fields: [slackIntegration.organizationId],
    references: [organization.id],
  }),
  workspace: one(slackWorkspace, {
    fields: [slackIntegration.slackWorkspaceId],
    references: [slackWorkspace.id],
  }),
  createdBy: one(user, {
    fields: [slackIntegration.createdById],
    references: [user.id],
  }),
}));
