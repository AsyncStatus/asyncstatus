import { relations } from "drizzle-orm";

export { Account, AccountInsert, AccountUpdate, account } from "./account";
export {
  Changelog,
  ChangelogInsert,
  ChangelogUpdate,
  changelog,
} from "./changelog";
export {
  ChangelogGenerationJob,
  ChangelogGenerationJobInsert,
  ChangelogGenerationJobUpdate,
  changelogGenerationJob,
} from "./changelog-generation-job";
export {
  ChangelogGithubContributor,
  ChangelogGithubContributorInsert,
  ChangelogGithubContributorUpdate,
  changelogGithubContributor,
} from "./changelog-github-contributor";
export {
  ChangelogGithubEvent,
  ChangelogGithubEventInsert,
  ChangelogGithubEventUpdate,
  changelogGithubEvent,
} from "./changelog-github-event";
export {
  ChangelogGithubRepoContributor,
  ChangelogGithubRepoContributorInsert,
  ChangelogGithubRepoContributorUpdate,
  changelogGithubRepoContributor,
} from "./changelog-github-repo-contributor";
export {
  ChangelogGithubRepository,
  ChangelogGithubRepositoryInsert,
  ChangelogGithubRepositoryUpdate,
  changelogGithubRepository,
} from "./changelog-github-repository";
export {
  DiscordChannel,
  DiscordChannelInsert,
  DiscordChannelUpdate,
  discordChannel,
} from "./discord-channel";
export {
  DiscordEvent,
  DiscordEventInsert,
  DiscordEventUpdate,
  discordEvent,
} from "./discord-event";
export {
  DiscordEventVector,
  DiscordEventVectorInsert,
  DiscordEventVectorUpdate,
  discordEventVector,
} from "./discord-event-vector";
export {
  DiscordIntegration,
  DiscordIntegrationInsert,
  DiscordIntegrationUpdate,
  discordIntegration,
} from "./discord-integration";
export {
  DiscordServer,
  DiscordServerInsert,
  DiscordServerUpdate,
  discordServer,
} from "./discord-server";
export { DiscordUser, DiscordUserInsert, DiscordUserUpdate, discordUser } from "./discord-user";
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
export { GitlabEvent, GitlabEventInsert, GitlabEventUpdate, gitlabEvent } from "./gitlab-event";
export {
  GitlabEventVector,
  GitlabEventVectorInsert,
  GitlabEventVectorUpdate,
  gitlabEventVector,
} from "./gitlab-event-vector";
export {
  GitlabIntegration,
  GitlabIntegrationInsert,
  GitlabIntegrationUpdate,
  gitlabIntegration,
} from "./gitlab-integration";
export {
  GitlabProject,
  GitlabProjectInsert,
  GitlabProjectUpdate,
  gitlabProject,
} from "./gitlab-project";
export { GitlabUser, GitlabUserInsert, GitlabUserUpdate, gitlabUser } from "./gitlab-user";
export { Invitation, InvitationInsert, InvitationUpdate, invitation } from "./invitation";
export { Jwks, JwksInsert, JwksUpdate, jwks } from "./jwks";
export { LinearEvent, LinearEventInsert, LinearEventUpdate, linearEvent } from "./linear-event";
export {
  LinearEventVector,
  LinearEventVectorInsert,
  LinearEventVectorUpdate,
  linearEventVector,
} from "./linear-event-vector";
export {
  LinearIntegration,
  LinearIntegrationInsert,
  LinearIntegrationUpdate,
  linearIntegration,
} from "./linear-integration";
export { LinearIssue, LinearIssueInsert, LinearIssueUpdate, linearIssue } from "./linear-issue";
export {
  LinearProject,
  LinearProjectInsert,
  LinearProjectUpdate,
  linearProject,
} from "./linear-project";
export { LinearTeam, LinearTeamInsert, LinearTeamUpdate, linearTeam } from "./linear-team";
export { LinearUser, LinearUserInsert, LinearUserUpdate, linearUser } from "./linear-user";
export { Member, MemberInsert, MemberUpdate, member } from "./member";
export { Organization, OrganizationInsert, OrganizationUpdate, organization } from "./organization";
export {
  Schedule,
  ScheduleInsert,
  ScheduleUpdate,
  schedule,
} from "./schedule";
export {
  ScheduleConfig,
  ScheduleConfigDeliveryMethod,
  ScheduleConfigGenerateFor,
  ScheduleConfigGenerateUpdates,
  ScheduleConfigGenerateUpdatesV3,
  ScheduleConfigRemindToPostUpdates,
  ScheduleConfigRemindToPostUpdatesV3,
  ScheduleConfigSendSummaries,
  ScheduleConfigSendSummariesV3,
  ScheduleConfigSummaryFor,
  ScheduleConfigUsingActivityFrom,
  ScheduleConfigV3,
  ScheduleName,
  ScheduleNameV3,
} from "./schedule-config-schema";
export {
  ScheduleRun,
  ScheduleRunInsert,
  ScheduleRunUpdate,
  ScheduleStatus,
  scheduleRun,
} from "./schedule-run";
export {
  ScheduleRunTask,
  ScheduleRunTaskInsert,
  ScheduleRunTaskStatus,
  ScheduleRunTaskUpdate,
  scheduleRunTask,
} from "./schedule-run-task";
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
export { Summary, SummaryInsert, SummaryUpdate, summary } from "./summary";
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
// removed unused direct import of jwks
import { changelog } from "./changelog";
import { changelogGenerationJob } from "./changelog-generation-job";
import { changelogGithubContributor } from "./changelog-github-contributor";
import { changelogGithubRepoContributor } from "./changelog-github-repo-contributor";
import { discordChannel } from "./discord-channel";
import { discordEvent } from "./discord-event";
import { discordIntegration } from "./discord-integration";
import { discordServer } from "./discord-server";
import { discordUser } from "./discord-user";
import { githubEvent } from "./github-event";
import { githubEventVector } from "./github-event-vector";
import { githubIntegration } from "./github-integration";
import { githubRepository } from "./github-repository";
import { githubUser } from "./github-user";
import { gitlabEvent } from "./gitlab-event";
import { gitlabEventVector } from "./gitlab-event-vector";
import { gitlabIntegration } from "./gitlab-integration";
import { gitlabProject } from "./gitlab-project";
import { gitlabUser } from "./gitlab-user";
import { invitation } from "./invitation";
import { linearEvent } from "./linear-event";
import { linearEventVector } from "./linear-event-vector";
import { linearIntegration } from "./linear-integration";
import { linearIssue } from "./linear-issue";
import { linearProject } from "./linear-project";
import { linearTeam } from "./linear-team";
import { linearUser } from "./linear-user";
import { member } from "./member";
import { organization } from "./organization";
import { schedule } from "./schedule";
import { scheduleRun } from "./schedule-run";
import { scheduleRunTask } from "./schedule-run-task";
import { slackChannel } from "./slack-channel";
import { slackEvent } from "./slack-event";
import { slackEventVector } from "./slack-event-vector";
import { slackIntegration } from "./slack-integration";
import { slackUser } from "./slack-user";
import { statusGenerationJob } from "./status-generation-job";
import { statusUpdate } from "./status-update";
import { statusUpdateItem } from "./status-update-item";
import { summary } from "./summary";
import { team } from "./team";
// imported for side effects to ensure table is included in schema
import { teamMembership } from "./team-membership";
import { user } from "./user";
import { userTimezoneHistory } from "./user-timezone-history";

// Relations section - after all tables are defined
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  timezoneHistory: many(userTimezoneHistory),
  summaries: many(summary),
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
  gitlabIntegration: one(gitlabIntegration),
  slackIntegration: one(slackIntegration),
  linearIntegration: one(linearIntegration),
  schedules: many(schedule),
  summaries: many(summary),
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
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMemberships: many(teamMembership),
  statusUpdates: many(statusUpdate),
  summaries: many(summary),
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

export const discordIntegrationRelations = relations(discordIntegration, ({ one, many }) => ({
  organization: one(organization, {
    fields: [discordIntegration.organizationId],
    references: [organization.id],
  }),
  servers: many(discordServer),
  users: many(discordUser),
}));

export const discordServerRelations = relations(discordServer, ({ one, many }) => ({
  integration: one(discordIntegration, {
    fields: [discordServer.integrationId],
    references: [discordIntegration.id],
  }),
  channels: many(discordChannel),
  events: many(discordEvent),
}));

export const discordChannelRelations = relations(discordChannel, ({ one, many }) => ({
  server: one(discordServer, {
    fields: [discordChannel.serverId],
    references: [discordServer.id],
  }),
  events: many(discordEvent),
}));

export const discordUserRelations = relations(discordUser, ({ one }) => ({
  integration: one(discordIntegration, {
    fields: [discordUser.integrationId],
    references: [discordIntegration.id],
  }),
}));

export const discordEventRelations = relations(discordEvent, ({ one }) => ({
  server: one(discordServer, {
    fields: [discordEvent.serverId],
    references: [discordServer.id],
  }),
  user: one(discordUser, {
    fields: [discordEvent.discordUserId],
    references: [discordUser.discordUserId],
  }),
  channel: one(discordChannel, {
    fields: [discordEvent.channelId],
    references: [discordChannel.channelId],
  }),
}));

export const linearIntegrationRelations = relations(linearIntegration, ({ one, many }) => ({
  organization: one(organization, {
    fields: [linearIntegration.organizationId],
    references: [organization.id],
  }),
  teams: many(linearTeam),
  users: many(linearUser),
  issues: many(linearIssue),
  projects: many(linearProject),
  events: many(linearEvent),
}));

export const linearTeamRelations = relations(linearTeam, ({ one }) => ({
  integration: one(linearIntegration, {
    fields: [linearTeam.integrationId],
    references: [linearIntegration.id],
  }),
}));

export const linearUserRelations = relations(linearUser, ({ one }) => ({
  integration: one(linearIntegration, {
    fields: [linearUser.integrationId],
    references: [linearIntegration.id],
  }),
}));

export const linearProjectRelations = relations(linearProject, ({ one }) => ({
  integration: one(linearIntegration, {
    fields: [linearProject.integrationId],
    references: [linearIntegration.id],
  }),
}));

export const linearIssueRelations = relations(linearIssue, ({ one, many }) => ({
  integration: one(linearIntegration, {
    fields: [linearIssue.integrationId],
    references: [linearIntegration.id],
  }),
  events: many(linearEvent),
}));

export const linearEventRelations = relations(linearEvent, ({ one, many }) => ({
  integration: one(linearIntegration, {
    fields: [linearEvent.integrationId],
    references: [linearIntegration.id],
  }),
  issue: one(linearIssue, {
    fields: [linearEvent.issueId],
    references: [linearIssue.issueId],
  }),
  vectors: many(linearEventVector),
}));

export const linearEventVectorRelations = relations(linearEventVector, ({ one }) => ({
  event: one(linearEvent, {
    fields: [linearEventVector.eventId],
    references: [linearEvent.id],
  }),
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

export const gitlabIntegrationRelations = relations(gitlabIntegration, ({ one, many }) => ({
  organization: one(organization, {
    fields: [gitlabIntegration.organizationId],
    references: [organization.id],
  }),
  projects: many(gitlabProject),
  users: many(gitlabUser),
}));

export const gitlabProjectRelations = relations(gitlabProject, ({ one, many }) => ({
  integration: one(gitlabIntegration, {
    fields: [gitlabProject.integrationId],
    references: [gitlabIntegration.id],
  }),
  events: many(gitlabEvent),
}));

export const gitlabEventRelations = relations(gitlabEvent, ({ one, many }) => ({
  project: one(gitlabProject, {
    fields: [gitlabEvent.projectId],
    references: [gitlabProject.id],
  }),
  vectors: many(gitlabEventVector),
}));

export const gitlabEventVectorRelations = relations(gitlabEventVector, ({ one }) => ({
  event: one(gitlabEvent, {
    fields: [gitlabEventVector.eventId],
    references: [gitlabEvent.id],
  }),
}));

export const gitlabUserRelations = relations(gitlabUser, ({ one }) => ({
  integration: one(gitlabIntegration, {
    fields: [gitlabUser.integrationId],
    references: [gitlabIntegration.id],
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

export const changelogRelations = relations(changelog, ({ many }) => ({
  generationJobs: many(changelogGenerationJob),
}));

export const changelogGenerationJobRelations = relations(changelogGenerationJob, ({ one }) => ({
  changelog: one(changelog, {
    fields: [changelogGenerationJob.changelogId],
    references: [changelog.id],
  }),
}));

export const changelogGithubContributorRelations = relations(
  changelogGithubContributor,
  ({ many }) => ({
    repoContributions: many(changelogGithubRepoContributor),
  }),
);

export const changelogGithubRepoContributorRelations = relations(
  changelogGithubRepoContributor,
  ({ one }) => ({
    contributor: one(changelogGithubContributor, {
      fields: [changelogGithubRepoContributor.contributorLogin],
      references: [changelogGithubContributor.login],
    }),
  }),
);

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
}));

export const scheduleRunRelations = relations(scheduleRun, ({ one, many }) => ({
  createdByMember: one(member, {
    fields: [scheduleRun.createdByMemberId],
    references: [member.id],
  }),
  schedule: one(schedule, {
    fields: [scheduleRun.scheduleId],
    references: [schedule.id],
  }),
  tasks: many(scheduleRunTask),
}));

export const scheduleRunTaskRelations = relations(scheduleRunTask, ({ one }) => ({
  scheduleRun: one(scheduleRun, {
    fields: [scheduleRunTask.scheduleRunId],
    references: [scheduleRun.id],
  }),
}));

export const summaryRelations = relations(summary, ({ one }) => ({
  organization: one(organization, {
    fields: [summary.organizationId],
    references: [organization.id],
  }),
  team: one(team, {
    fields: [summary.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [summary.userId],
    references: [user.id],
  }),
}));
