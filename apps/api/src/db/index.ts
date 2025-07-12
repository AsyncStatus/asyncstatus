import { relations } from "drizzle-orm";

export { Account, AccountInsert, AccountUpdate, account } from "./account";
export { GithubEvent, GithubEventInsert, GithubEventUpdate, githubEvent } from "./github-event";
export {
  GithubEventVector,
  GithubEventVectorInsert,
  GithubEventVectorUpdate,
  githubEventVector,
} from "./github-event-vector";
export {
  GithubIntegration,
  GithubIntegrationInsert,
  GithubIntegrationUpdate,
  githubIntegration,
} from "./github-integration";
export {
  GithubRepository,
  GithubRepositoryInsert,
  GithubRepositoryUpdate,
  githubRepository,
} from "./github-repository";
export { GithubUser, GithubUserInsert, GithubUserUpdate, githubUser } from "./github-user";
export { Invitation, InvitationInsert, InvitationUpdate, invitation } from "./invitation";
export { Member, MemberInsert, MemberUpdate, member } from "./member";
export { Organization, OrganizationInsert, OrganizationUpdate, organization } from "./organization";
export { statusGenerationJob } from "./status-generation-job";
export {
  StatusUpdate,
  StatusUpdateInsert,
  StatusUpdateUpdate,
  statusUpdate,
} from "./status-update";
export {
  StatusUpdateItem,
  StatusUpdateItemInsert,
  StatusUpdateItemUpdate,
  statusUpdateItem,
} from "./status-update-item";
export { Team, TeamInsert, TeamUpdate, team } from "./team";
export {
  TeamMembership,
  TeamMembershipInsert,
  TeamMembershipUpdate,
  teamMembership,
} from "./team-membership";
export { User, UserInsert, UserUpdate, user } from "./user";
export {
  UserTimezoneHistory,
  UserTimezoneHistoryInsert,
  UserTimezoneHistoryUpdate,
  userTimezoneHistory,
} from "./user-timezone-history";
export { Verification, VerificationInsert, VerificationUpdate, verification } from "./verification";

// Import tables for relations
import { account } from "./account";
import { githubEvent } from "./github-event";
import { githubEventVector } from "./github-event-vector";
import { githubIntegration } from "./github-integration";
import { githubRepository } from "./github-repository";
import { githubUser } from "./github-user";
import { invitation } from "./invitation";
import { member } from "./member";
import { organization } from "./organization";
import { statusGenerationJob } from "./status-generation-job";
import { statusUpdate } from "./status-update";
import { statusUpdateItem } from "./status-update-item";
import { team } from "./team";
import { teamMembership } from "./team-membership";
import { user } from "./user";
import { userTimezoneHistory } from "./user-timezone-history";

// Relations section - after all tables are defined
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  timezoneHistory: many(userTimezoneHistory),
}));

export const userTimezoneHistoryRelations = relations(userTimezoneHistory, ({ one }) => ({
  user: one(user, {
    fields: [userTimezoneHistory.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many, one }) => ({
  members: many(member),
  teams: many(team),
  invitations: many(invitation),
  githubIntegration: one(githubIntegration),
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

export const statusUpdateRelations = relations(statusUpdate, ({ one, many }) => ({
  member: one(member, {
    fields: [statusUpdate.memberId],
    references: [member.id],
  }),
  team: one(team, {
    fields: [statusUpdate.teamId],
    references: [team.id],
  }),
  items: many(statusUpdateItem),
}));

export const githubIntegrationRelations = relations(githubIntegration, ({ one, many }) => ({
  organization: one(organization, {
    fields: [githubIntegration.organizationId],
    references: [organization.id],
  }),
  repositories: many(githubRepository),
  users: many(githubUser),
}));

export const githubRepositoryRelations = relations(githubRepository, ({ one, many }) => ({
  integration: one(githubIntegration, {
    fields: [githubRepository.integrationId],
    references: [githubIntegration.id],
  }),
  events: many(githubEvent),
}));

export const githubEventRelations = relations(githubEvent, ({ one, many }) => ({
  repository: one(githubRepository, {
    fields: [githubEvent.repositoryId],
    references: [githubRepository.id],
  }),
  vectors: many(githubEventVector),
}));

export const githubUserRelations = relations(githubUser, ({ one }) => ({
  integration: one(githubIntegration, {
    fields: [githubUser.integrationId],
    references: [githubIntegration.id],
  }),
}));

export const githubEventVectorRelations = relations(githubEventVector, ({ one }) => ({
  event: one(githubEvent, {
    fields: [githubEventVector.eventId],
    references: [githubEvent.id],
  }),
}));

export const statusUpdateItemRelations = relations(statusUpdateItem, ({ one }) => ({
  statusUpdate: one(statusUpdate, {
    fields: [statusUpdateItem.statusUpdateId],
    references: [statusUpdate.id],
  }),
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

export const statusGenerationJobRelations = relations(statusGenerationJob, ({ one }) => ({
  member: one(member, {
    fields: [statusGenerationJob.memberId],
    references: [member.id],
  }),
  statusUpdate: one(statusUpdate, {
    fields: [statusGenerationJob.statusUpdateId],
    references: [statusUpdate.id],
  }),
}));
