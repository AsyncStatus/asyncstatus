import { relations, sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

import type {
  AnyGithubWebhookEventDefinition,
  GithubWebhookEventName,
} from "../lib/github-event-definition";

const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    image: text("image"),
    timezone: text("timezone").default("UTC"),
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
    // Optional Slack username - nullable by default
    slackUsername: text("slack_username"),
    githubId: text("github_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
  },
  (t) => [
    index("organization_member_id_index").on(t.organizationId),
    index("user_member_id_index").on(t.userId),
    index("member_github_id_index").on(t.githubId),
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
    editorJson: text("editor_json", { mode: "json" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
    effectiveTo: integer("effective_to", { mode: "timestamp" }).notNull(),
    mood: text("mood"),
    emoji: text("emoji"),
    notes: text("notes"),
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
    isInProgress: integer("is_in_progress", { mode: "boolean" })
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

export const githubIntegration = sqliteTable(
  "github_integration",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    installationId: text("installation_id").notNull(),
    accessToken: text("access_token"),
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),

    syncId: text("sync_id"),
    syncStatusName: text("sync_status_name"),
    syncStatusStep: text("sync_status_step"),
    syncStatusUpdatedAt: integer("sync_updated_at", { mode: "timestamp" }),
    syncStartedAt: integer("sync_started_at", { mode: "timestamp" }),
    syncFinishedAt: integer("sync_finished_at", { mode: "timestamp" }),
    syncError: text("sync_error"),
    syncErrorAt: integer("sync_error_at", { mode: "timestamp" }),

    deleteId: text("delete_id"),
    deleteStatus: text("delete_status"),
    deleteError: text("delete_error"),
  },
  (t) => [
    index("github_organization_id_index").on(t.organizationId),
    index("github_installation_id_index").on(t.installationId),
  ],
);

export const githubRepository = sqliteTable(
  "github_repository",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => githubIntegration.id, { onDelete: "cascade" }),
    repoId: text("repo_id").notNull().unique(),
    name: text("name").notNull(),
    owner: text("owner").notNull(),
    fullName: text("full_name").notNull(),
    private: integer("private", { mode: "boolean" }).notNull(),
    htmlUrl: text("html_url").notNull(),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("github_repo_integration_id_index").on(t.integrationId),
    index("github_repo_repo_id_index").on(t.repoId),
  ],
);

export const githubUser = sqliteTable(
  "github_user",
  {
    id: text("id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => githubIntegration.id, { onDelete: "cascade" }),
    githubId: text("github_id").notNull().unique(),
    login: text("login").notNull(),
    avatarUrl: text("avatar_url"),
    htmlUrl: text("html_url").notNull(),
    name: text("name"),
    email: text("email"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("github_user_integration_id_index").on(t.integrationId),
    index("github_user_github_id_index").on(t.githubId),
  ],
);

export const githubEvent = sqliteTable(
  "github_event",
  {
    id: text("id").primaryKey(),
    githubId: text("github_id").notNull().unique(), // GitHub event ID (snowflake)
    githubActorId: text("github_actor_id").notNull(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => githubRepository.id, { onDelete: "cascade" }),
    type: text("type").notNull().$type<GithubWebhookEventName>(),
    payload: text("payload", {
      mode: "json",
    }).$type<AnyGithubWebhookEventDefinition>(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    insertedAt: integer("inserted_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [
    index("github_event_repository_id_idx").on(t.repositoryId),
    index("github_event_created_at_idx").on(t.createdAt),
    index("github_event_github_id_idx").on(t.githubId),
    index("github_event_github_actor_id_idx").on(t.githubActorId),
    index("github_event_type_idx").on(t.type),
  ],
);

export const githubEventVector = sqliteTable(
  "github_event_vector",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => githubEvent.id, { onDelete: "cascade" }),
    embeddingText: text("embedding_text").notNull(),
    embedding: float32Array("embedding", { dimensions: 1024 }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("github_event_vector_event_id_idx").on(t.eventId)],
);

export const statusGenerationJob = sqliteTable(
  "status_generation_job",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    effectiveFrom: integer("effective_from", { mode: "timestamp" }).notNull(),
    effectiveTo: integer("effective_to", { mode: "timestamp" }).notNull(),
    state: text("state").notNull(), // queued | running | done | error
    errorMessage: text("error_message"),
    statusUpdateId: text("status_update_id").references(() => statusUpdate.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
  },
  (t) => [
    index("status_job_member_idx").on(t.memberId),
    index("status_job_state_idx").on(t.state),
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

export const organizationRelations = relations(
  organization,
  ({ many, one }) => ({
    members: many(member),
    teams: many(team),
    invitations: many(invitation),
    publicStatusShares: many(publicStatusShare),
    githubIntegration: one(githubIntegration),
  }),
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

export const githubIntegrationRelations = relations(
  githubIntegration,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [githubIntegration.organizationId],
      references: [organization.id],
    }),
    repositories: many(githubRepository),
    users: many(githubUser),
  }),
);

export const githubRepositoryRelations = relations(
  githubRepository,
  ({ one, many }) => ({
    integration: one(githubIntegration, {
      fields: [githubRepository.integrationId],
      references: [githubIntegration.id],
    }),
    events: many(githubEvent),
  }),
);

export const githubUserRelations = relations(githubUser, ({ one }) => ({
  integration: one(githubIntegration, {
    fields: [githubUser.integrationId],
    references: [githubIntegration.id],
  }),
}));

export const githubEventRelations = relations(githubEvent, ({ one, many }) => ({
  repository: one(githubRepository, {
    fields: [githubEvent.repositoryId],
    references: [githubRepository.id],
  }),
  vectors: many(githubEventVector),
}));

export const githubEventVectorRelations = relations(
  githubEventVector,
  ({ one }) => ({
    event: one(githubEvent, {
      fields: [githubEventVector.eventId],
      references: [githubEvent.id],
    }),
  }),
);

export const statusGenerationJobRelations = relations(
  statusGenerationJob,
  ({ one }) => ({
    member: one(member, {
      fields: [statusGenerationJob.memberId],
      references: [member.id],
    }),
    statusUpdate: one(statusUpdate, {
      fields: [statusGenerationJob.statusUpdateId],
      references: [statusUpdate.id],
    }),
  }),
);
