import { z as z3 } from "zod";
import { z } from "zod/v4";
import { DiscordChannel } from "./discord-channel";
import { GithubRepository } from "./github-repository";
import { LinearProject } from "./linear-project";
import { LinearTeam } from "./linear-team";
import { Member } from "./member";
import { Organization } from "./organization";
import { SlackChannel } from "./slack-channel";
import { Team } from "./team";

export const ScheduleConfigDeliveryMethod = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("organization"),
    value: Organization.shape.slug, // everyone's email
  }),
  z.strictObject({
    type: z.literal("member"),
    value: Member.shape.id, // member email
  }),
  z.strictObject({
    type: z.literal("team"),
    value: Team.shape.id, // every team member's email
  }),
  z.strictObject({
    type: z.literal("customEmail"),
    value: z.string(), // custom email
  }),
  z.strictObject({
    type: z.literal("slackChannel"),
    value: SlackChannel.shape.channelId, // slack channel
  }),
  z.strictObject({
    type: z.literal("discordChannel"),
    value: DiscordChannel.shape.channelId, // discord channel
  }),
]);
export type ScheduleConfigDeliveryMethod = z.infer<typeof ScheduleConfigDeliveryMethod>;

export const ScheduleConfigUsingActivityFrom = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("anyIntegration"),
    value: z.literal("anyIntegration"), // any integration activity
  }),
  z.strictObject({
    type: z.literal("anyGithub"),
    value: z.literal("anyGithub"), // any github activity
  }),
  z.strictObject({
    type: z.literal("anyGitlab"),
    value: z.literal("anyGitlab"), // any gitlab activity
  }),
  z.strictObject({
    type: z.literal("anySlack"),
    value: z.literal("anySlack"), // any slack activity
  }),
  z.strictObject({
    type: z.literal("anyDiscord"),
    value: z.literal("anyDiscord"), // any discord activity
  }),
  z.strictObject({
    type: z.literal("anyLinear"),
    value: z.literal("anyLinear"), // any linear activity
  }),
  z.strictObject({
    type: z.literal("slackChannel"),
    value: SlackChannel.shape.channelId, // slack channel activity
  }),
  z.strictObject({
    type: z.literal("githubRepository"),
    value: GithubRepository.shape.id, // github repository activity
  }),
  z.strictObject({
    type: z.literal("gitlabProject"),
    value: z.string(), // gitlab project id (gitlab_project.id)
  }),
  z.strictObject({
    type: z.literal("discordChannel"),
    value: DiscordChannel.shape.channelId, // discord channel activity
  }),
  z.strictObject({
    type: z.literal("linearTeam"),
    value: LinearTeam.shape.teamId, // linear team activity
  }),
  z.strictObject({
    type: z.literal("linearProject"),
    value: LinearProject.shape.projectId, // linear project activity
  }),
]);
export type ScheduleConfigUsingActivityFrom = z.infer<typeof ScheduleConfigUsingActivityFrom>;

export const ScheduleConfigGenerateFor = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("organization"),
    value: Organization.shape.slug, // everyone
    usingActivityFrom: ScheduleConfigUsingActivityFrom.array(),
  }),
  z.strictObject({
    type: z.literal("member"),
    value: Member.shape.id, // member
    usingActivityFrom: ScheduleConfigUsingActivityFrom.array(),
  }),
  z.strictObject({
    type: z.literal("team"),
    value: Team.shape.id, // every team member
    usingActivityFrom: ScheduleConfigUsingActivityFrom.array(),
  }),
]);
export type ScheduleConfigGenerateFor = z.infer<typeof ScheduleConfigGenerateFor>;

export const ScheduleConfigRemindToPostUpdates = z.strictObject({
  name: z.literal("remindToPostUpdates"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  deliveryMethods: z.array(ScheduleConfigDeliveryMethod.or(z.undefined())),
});
export type ScheduleConfigRemindToPostUpdates = z.infer<typeof ScheduleConfigRemindToPostUpdates>;

export const ScheduleConfigGenerateUpdates = z.strictObject({
  name: z.literal("generateUpdates"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  generateFor: z.array(ScheduleConfigGenerateFor.or(z.undefined())),
});
export type ScheduleConfigGenerateUpdates = z.infer<typeof ScheduleConfigGenerateUpdates>;

export const ScheduleConfigSummaryFor = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("organization"),
    value: Organization.shape.slug, // everyone's status updates
  }),
  z.strictObject({
    type: z.literal("member"),
    value: Member.shape.id, // member's status updates
  }),
  z.strictObject({
    type: z.literal("team"),
    value: Team.shape.id, // team's status updates
  }),
  z.strictObject({
    type: z.literal("anyGithub"),
    value: z.literal("anyGithub"), // any github activity
  }),
  z.strictObject({
    type: z.literal("anyGitlab"),
    value: z.literal("anyGitlab"), // any gitlab activity
  }),
  z.strictObject({
    type: z.literal("anySlack"),
    value: z.literal("anySlack"), // any slack activity
  }),
  z.strictObject({
    type: z.literal("anyDiscord"),
    value: z.literal("anyDiscord"), // any discord activity
  }),
  z.strictObject({
    type: z.literal("anyLinear"),
    value: z.literal("anyLinear"), // any linear activity
  }),
  z.strictObject({
    type: z.literal("slackChannel"),
    value: SlackChannel.shape.channelId, // slack channel activity
  }),
  z.strictObject({
    type: z.literal("githubRepository"),
    value: GithubRepository.shape.id, // github repository activity
  }),
  z.strictObject({
    type: z.literal("gitlabProject"),
    value: z.string(), // gitlab project id (gitlab_project.id)
  }),
  z.strictObject({
    type: z.literal("discordChannel"),
    value: DiscordChannel.shape.channelId, // discord channel activity
  }),
  z.strictObject({
    type: z.literal("linearTeam"),
    value: LinearTeam.shape.teamId, // linear team activity
  }),
  z.strictObject({
    type: z.literal("linearProject"),
    value: LinearProject.shape.projectId, // linear project activity
  }),
]);
export type ScheduleConfigSummaryFor = z.infer<typeof ScheduleConfigSummaryFor>;

export const ScheduleConfigSendSummaries = z.strictObject({
  name: z.literal("sendSummaries"),
  timeOfDay: z.iso.time({ precision: -1 }),
  timezone: z.string().min(1),
  recurrence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  dayOfWeek: z.number().min(0).max(6).optional(), // 0-6 for weekly (0 = Monday)
  dayOfMonth: z.number().min(1).max(28).optional(), // 1-28 for monthly
  summaryFor: z.array(ScheduleConfigSummaryFor.or(z.undefined())),
  deliveryMethods: z.array(ScheduleConfigDeliveryMethod.or(z.undefined())),
});
export type ScheduleConfigSendSummaries = z.infer<typeof ScheduleConfigSendSummaries>;

export const ScheduleConfig = z.discriminatedUnion("name", [
  ScheduleConfigRemindToPostUpdates,
  ScheduleConfigGenerateUpdates,
  ScheduleConfigSendSummaries,
]);
export type ScheduleConfig = z.infer<typeof ScheduleConfig>;

export const ScheduleName = z.enum(["remindToPostUpdates", "generateUpdates", "sendSummaries"]);
export type ScheduleName = z.infer<typeof ScheduleName>;

export const ScheduleNameV3 = z3.enum(["remindToPostUpdates", "generateUpdates", "sendSummaries"]);
export type ScheduleNameV3 = z3.infer<typeof ScheduleNameV3>;

// V3 equivalents using zod v3 (z3)
const ScheduleConfigDeliveryMethodV3 = z3
  .discriminatedUnion("type", [
    z3
      .object({
        type: z3.literal("organization"),
        value: z3.string().describe("Organization slug; deliver to everyone in the organization"),
      })
      .strict()
      .describe("Deliver to all members via their primary email"),
    z3
      .object({
        type: z3.literal("member"),
        value: z3.string().describe("Member ID; deliver to this single member's email"),
      })
      .strict()
      .describe("Deliver to a specific member"),
    z3
      .object({
        type: z3.literal("team"),
        value: z3.string().describe("Team ID; deliver to all team members' emails"),
      })
      .strict()
      .describe("Deliver to all members of a team"),
    z3
      .object({
        type: z3.literal("customEmail"),
        value: z3.string().describe("Arbitrary email address to deliver to"),
      })
      .strict()
      .describe("Deliver to a custom email address"),
    z3
      .object({
        type: z3.literal("slackChannel"),
        value: z3.string().describe("Slack channel ID (e.g., C0123456789)"),
      })
      .strict()
      .describe("Post to a Slack channel"),
    z3
      .object({
        type: z3.literal("discordChannel"),
        value: z3.string().describe("Discord channel ID (e.g., 123456789012345678)"),
      })
      .strict()
      .describe("Post to a Discord channel"),
  ])
  .optional()
  .describe("A single delivery method entry");

// Using Activity From (v3) — mirrors v4 discriminated union
const ScheduleConfigUsingActivityFromV3 = z3
  .discriminatedUnion("type", [
    z3
      .object({
        type: z3.literal("anyIntegration"),
        value: z3.literal("anyIntegration"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyGithub"),
        value: z3.literal("anyGithub"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyGitlab"),
        value: z3.literal("anyGitlab"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anySlack"),
        value: z3.literal("anySlack"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyDiscord"),
        value: z3.literal("anyDiscord"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyLinear"),
        value: z3.literal("anyLinear"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("slackChannel"),
        value: z3.string().describe("Slack channel ID (e.g., C0123456789)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("githubRepository"),
        value: z3.string().describe("GitHub repository ID"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("gitlabProject"),
        value: z3.string().describe("GitLab project ID (gitlab_project.id)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("discordChannel"),
        value: z3.string().describe("Discord channel ID (e.g., 123456789012345678)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("linearTeam"),
        value: z3.string().describe("Linear team ID (e.g., team_... from Linear)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("linearProject"),
        value: z3.string().describe("Linear project ID (e.g., proj_... from Linear)"),
      })
      .strict(),
  ])
  .describe("Activity sources to use when generating updates");

const AnyIntegrationDefaultV3 = { type: "anyIntegration", value: "anyIntegration" } as const;

// Generate For (v3) — mirrors v4 discriminant and embeds UsingActivityFrom
const ScheduleConfigGenerateForV3 = z3
  .discriminatedUnion("type", [
    z3
      .object({
        type: z3.literal("organization"),
        value: z3.string().describe("Organization slug to generate for everyone"),
        usingActivityFrom: z3
          .array(ScheduleConfigUsingActivityFromV3.optional())
          .default([AnyIntegrationDefaultV3])
          .describe("Which integrations to use as activity sources"),
      })
      .strict()
      .describe("Generate for the whole organization"),
    z3
      .object({
        type: z3.literal("member"),
        value: z3.string().describe("Member ID to generate for"),
        usingActivityFrom: z3
          .array(ScheduleConfigUsingActivityFromV3.optional())
          .default([AnyIntegrationDefaultV3])
          .describe("Which integrations to use as activity sources"),
      })
      .strict()
      .describe("Generate for a specific member"),
    z3
      .object({
        type: z3.literal("team"),
        value: z3.string().describe("Team ID to generate for all members"),
        usingActivityFrom: z3
          .array(ScheduleConfigUsingActivityFromV3.optional())
          .default([AnyIntegrationDefaultV3])
          .describe("Which integrations to use as activity sources"),
      })
      .strict()
      .describe("Generate for a specific team"),
  ])
  .describe("Targets to generate updates for");

export const ScheduleConfigRemindToPostUpdatesV3 = z3
  .object({
    name: z3.literal("remindToPostUpdates").describe("Schedule type identifier"),
    timeOfDay: z3
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .describe("Local time of day in 24h HH:mm format (e.g., 09:30)"),
    timezone: z3.string().min(1).describe("IANA timezone (e.g., UTC, Europe/London, America/NYC)"),
    recurrence: z3
      .enum(["daily", "weekly", "monthly"])
      .default("daily")
      .describe("How often this schedule runs"),
    dayOfWeek: z3
      .number()
      .min(0)
      .max(6)
      .optional()
      .describe("0-6 (Monday=0). Required for weekly recurrence"),
    dayOfMonth: z3
      .number()
      .min(1)
      .max(28)
      .optional()
      .describe("1-28. Required for monthly recurrence"),
    deliveryMethods: z3
      .array(ScheduleConfigDeliveryMethodV3)
      .default([])
      .describe("Where reminders should be delivered (email, Slack, Discord, etc.)"),
  })
  .strict()
  .describe("Configuration for sending reminders to post updates");

export type ScheduleConfigRemindToPostUpdatesV3 = z3.infer<
  typeof ScheduleConfigRemindToPostUpdatesV3
>;

export const ScheduleConfigGenerateUpdatesV3 = z3
  .object({
    name: z3.literal("generateUpdates").describe("Schedule type identifier"),
    timeOfDay: z3
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .describe("Local time of day in 24h HH:mm format (e.g., 09:30)"),
    timezone: z3.string().min(1).describe("IANA timezone (e.g., UTC, Europe/London, America/NYC)"),
    recurrence: z3
      .enum(["daily", "weekly", "monthly"])
      .default("daily")
      .describe("How often this schedule runs"),
    dayOfWeek: z3
      .number()
      .min(0)
      .max(6)
      .optional()
      .describe("0-6 (Monday=0). Required for weekly recurrence"),
    dayOfMonth: z3
      .number()
      .min(1)
      .max(28)
      .optional()
      .describe("1-28. Required for monthly recurrence"),
    generateFor: z3
      .array(ScheduleConfigGenerateForV3.optional())
      .default([])
      .describe("List of generation targets"),
  })
  .strict()
  .describe("Configuration for AI-generated status updates");
export type ScheduleConfigGenerateUpdatesV3 = z3.infer<typeof ScheduleConfigGenerateUpdatesV3>;

// Summary For (v3) — mirrors v4 discriminated union
const ScheduleConfigSummaryForV3 = z3
  .discriminatedUnion("type", [
    z3
      .object({
        type: z3.literal("organization"),
        value: z3.string().describe("Everyone's status updates in the organization (slug)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("member"),
        value: z3.string().describe("Member ID; this member's status updates"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("team"),
        value: z3.string().describe("Team ID; the team's status updates"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyGithub"),
        value: z3.literal("anyGithub"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyGitlab"),
        value: z3.literal("anyGitlab"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anySlack"),
        value: z3.literal("anySlack"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyDiscord"),
        value: z3.literal("anyDiscord"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("anyLinear"),
        value: z3.literal("anyLinear"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("slackChannel"),
        value: z3.string().describe("Slack channel ID (e.g., C0123456789)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("githubRepository"),
        value: z3.string().describe("GitHub repository ID"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("gitlabProject"),
        value: z3.string().describe("GitLab project ID (gitlab_project.id)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("discordChannel"),
        value: z3.string().describe("Discord channel ID (e.g., 123456789012345678)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("linearTeam"),
        value: z3.string().describe("Linear team ID (e.g., team_... from Linear)"),
      })
      .strict(),
    z3
      .object({
        type: z3.literal("linearProject"),
        value: z3.string().describe("Linear project ID (e.g., proj_... from Linear)"),
      })
      .strict(),
  ])
  .describe("Targets whose activity/status should be summarized");

export const ScheduleConfigSendSummariesV3 = z3
  .object({
    name: z3.literal("sendSummaries").describe("Schedule type identifier"),
    timeOfDay: z3
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .describe("Local time of day in 24h HH:mm format (e.g., 09:30)"),
    timezone: z3.string().min(1).describe("IANA timezone (e.g., UTC, Europe/London, America/NYC)"),
    recurrence: z3
      .enum(["daily", "weekly", "monthly"])
      .default("daily")
      .describe("How often this schedule runs"),
    dayOfWeek: z3
      .number()
      .min(0)
      .max(6)
      .optional()
      .describe("0-6 (Monday=0). Required for weekly recurrence"),
    dayOfMonth: z3
      .number()
      .min(1)
      .max(28)
      .optional()
      .describe("1-28. Required for monthly recurrence"),
    summaryFor: z3
      .array(ScheduleConfigSummaryForV3.optional())
      .default([])
      .describe("What should be summarized before delivery"),
    deliveryMethods: z3
      .array(ScheduleConfigDeliveryMethodV3)
      .default([])
      .describe("Where summaries should be delivered (email, Slack, Discord, etc.)"),
  })
  .strict()
  .describe("Configuration for sending team summaries");
export type ScheduleConfigSendSummariesV3 = z3.infer<typeof ScheduleConfigSendSummariesV3>;

export const ScheduleConfigV3 = z3
  .discriminatedUnion("name", [
    ScheduleConfigRemindToPostUpdatesV3,
    ScheduleConfigGenerateUpdatesV3,
    ScheduleConfigSendSummariesV3,
  ])
  .describe(
    "Union of all schedule config types. Use name to select schema and supply required fields accordingly.",
  );
export type ScheduleConfigV3 = z3.infer<typeof ScheduleConfigV3>;
