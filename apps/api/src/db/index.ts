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
export {
  Schedule,
  ScheduleActionType,
  ScheduleInsert,
  ScheduleRecurrence,
  ScheduleUpdate,
  schedule,
} from "./schedule";
export {
  ScheduleDelivery,
  ScheduleDeliveryInsert,
  ScheduleDeliveryMethod,
  ScheduleDeliveryUpdate,
  scheduleDelivery,
} from "./schedule-delivery";
export {
  ScheduleDeliveryTarget,
  ScheduleDeliveryTargetInsert,
  ScheduleDeliveryTargetType,
  ScheduleDeliveryTargetUpdate,
  scheduleDeliveryTarget,
} from "./schedule-delivery-target";
export {
  ScheduleExecutionStatus,
  ScheduleRun,
  ScheduleRunInsert,
  ScheduleRunUpdate,
  ScheduleStatus,
  scheduleRun,
} from "./schedule-run";
export {
  ScheduleTarget,
  ScheduleTargetInsert,
  ScheduleTargetType,
  ScheduleTargetUpdate,
  scheduleTarget,
} from "./schedule-target";
export {
  SlackChannel,
  SlackChannelInsert,
  SlackChannelUpdate,
  slackChannel,
} from "./slack-channel";
export { SlackEvent, SlackEventInsert, SlackEventUpdate, slackEvent } from "./slack-event";
export {
  SlackEventVector,
  SlackEventVectorInsert,
  SlackEventVectorUpdate,
  slackEventVector,
} from "./slack-event-vector";
export {
  SlackIntegration,
  SlackIntegrationInsert,
  SlackIntegrationUpdate,
  slackIntegration,
} from "./slack-integration";
export { SlackUser, SlackUserInsert, SlackUserUpdate, slackUser } from "./slack-user";
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
import { schedule } from "./schedule";
import { scheduleDelivery } from "./schedule-delivery";
import { scheduleDeliveryTarget } from "./schedule-delivery-target";
import { scheduleRun } from "./schedule-run";
import { scheduleTarget } from "./schedule-target";
import { slackChannel } from "./slack-channel";
import { slackEvent } from "./slack-event";
import { slackEventVector } from "./slack-event-vector";
import { slackIntegration } from "./slack-integration";
import { slackUser } from "./slack-user";
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
  slackIntegration: one(slackIntegration),
  schedules: many(schedule),
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
  createdSchedules: many(schedule),
  scheduleTargets: many(scheduleTarget),
  scheduleDeliveryTargets: many(scheduleDeliveryTarget),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMemberships: many(teamMembership),
  statusUpdates: many(statusUpdate),
  scheduleTargets: many(scheduleTarget),
  scheduleDeliveryTargets: many(scheduleDeliveryTarget),
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

export const slackIntegrationRelations = relations(slackIntegration, ({ one, many }) => ({
  organization: one(organization, {
    fields: [slackIntegration.organizationId],
    references: [organization.id],
  }),
  users: many(slackUser),
  channels: many(slackChannel),
  events: many(slackEvent),
}));

export const slackUserRelations = relations(slackUser, ({ one }) => ({
  integration: one(slackIntegration, {
    fields: [slackUser.integrationId],
    references: [slackIntegration.id],
  }),
}));

export const slackChannelRelations = relations(slackChannel, ({ one, many }) => ({
  integration: one(slackIntegration, {
    fields: [slackChannel.integrationId],
    references: [slackIntegration.id],
  }),
  events: many(slackEvent),
  scheduleDeliveryTargets: many(scheduleDeliveryTarget),
}));

export const slackEventRelations = relations(slackEvent, ({ one, many }) => ({
  integration: one(slackIntegration, {
    fields: [slackEvent.slackTeamId],
    references: [slackIntegration.id],
  }),
  user: one(slackUser, {
    fields: [slackEvent.slackUserId],
    references: [slackUser.slackUserId],
  }),
  channel: one(slackChannel, {
    fields: [slackEvent.channelId],
    references: [slackChannel.channelId],
  }),
  vectors: many(slackEventVector),
}));

export const slackEventVectorRelations = relations(slackEventVector, ({ one }) => ({
  event: one(slackEvent, {
    fields: [slackEventVector.eventId],
    references: [slackEvent.id],
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

export const scheduleRelations = relations(schedule, ({ one, many }) => ({
  organization: one(organization, {
    fields: [schedule.organizationId],
    references: [organization.id],
  }),
  createdByMember: one(member, {
    fields: [schedule.createdByMemberId],
    references: [member.id],
  }),
  scheduleRuns: many(scheduleRun),
  targets: many(scheduleTarget),
  deliveries: many(scheduleDelivery),
  deliveryTargets: many(scheduleDeliveryTarget),
}));

export const scheduleRunRelations = relations(scheduleRun, ({ one }) => ({
  organization: one(organization, {
    fields: [scheduleRun.organizationId],
    references: [organization.id],
  }),
  createdByMember: one(member, {
    fields: [scheduleRun.createdByMemberId],
    references: [member.id],
  }),
  schedule: one(schedule, {
    fields: [scheduleRun.scheduleId],
    references: [schedule.id],
  }),
}));

export const scheduleTargetRelations = relations(scheduleTarget, ({ one }) => ({
  schedule: one(schedule, {
    fields: [scheduleTarget.scheduleId],
    references: [schedule.id],
  }),
  team: one(team, {
    fields: [scheduleTarget.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [scheduleTarget.memberId],
    references: [member.id],
  }),
}));

export const scheduleDeliveryRelations = relations(scheduleDelivery, ({ one }) => ({
  schedule: one(schedule, {
    fields: [scheduleDelivery.scheduleId],
    references: [schedule.id],
  }),
}));

export const scheduleDeliveryTargetRelations = relations(scheduleDeliveryTarget, ({ one }) => ({
  schedule: one(schedule, {
    fields: [scheduleDeliveryTarget.scheduleId],
    references: [schedule.id],
  }),
  team: one(team, {
    fields: [scheduleDeliveryTarget.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [scheduleDeliveryTarget.memberId],
    references: [member.id],
  }),
  slackChannel: one(slackChannel, {
    fields: [scheduleDeliveryTarget.slackChannelId],
    references: [slackChannel.id],
  }),
}));
