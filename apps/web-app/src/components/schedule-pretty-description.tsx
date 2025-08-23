import { listDiscordChannelsContract } from "@asyncstatus/api/typed-handlers/discord-integration";
import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listGithubRepositoriesContract } from "@asyncstatus/api/typed-handlers/github-integration";
import {
  listLinearProjectsContract,
  listLinearTeamsContract,
} from "@asyncstatus/api/typed-handlers/linear-integration";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import type {
  listSchedulesContract,
  ScheduleConfigDeliveryMethod,
  ScheduleConfigGenerateFor,
  ScheduleConfigSummaryFor,
  ScheduleConfigUsingActivityFrom,
} from "@asyncstatus/api/typed-handlers/schedule";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { dayjs } from "@asyncstatus/dayjs";
import { SiDiscord, SiGithub, SiLinear, SiSlack } from "@asyncstatus/ui/brand-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { BuildingIcon, UsersIcon } from "@asyncstatus/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export function SchedulePrettyDescription(props: {
  organizationSlug: string;
  schedule: (typeof listSchedulesContract.$infer.output)[number];
}) {
  const { schedule } = props;

  if (schedule.config.name === "generateUpdates") {
    return (
      <div className="text-lg leading-relaxed">
        <p className="inline">Generate updates for </p>
        {schedule.config.generateFor.map((item, index) => {
          if (!item) {
            return null;
          }

          const key = `${item.type}-${item.value}-${JSON.stringify(item.usingActivityFrom)}`;

          return (
            <GenerateForItem
              key={key}
              organizationSlug={props.organizationSlug}
              includeAnd={index > 0}
              generateFor={item}
            />
          );
        })}{" "}
        <ScheduleWhenItem organizationSlug={props.organizationSlug} schedule={schedule} />
      </div>
    );
  }

  if (schedule.config.name === "remindToPostUpdates") {
    return (
      <div className="text-lg leading-relaxed">
        <p className="inline">Send reminders for posting updates to </p>
        {schedule.config.deliveryMethods.map((item, index) => {
          if (!item) {
            return null;
          }

          return (
            <ScheduleDeliveryMethodItem
              key={`${item.type}-${item.value}`}
              organizationSlug={props.organizationSlug}
              includeAnd={index < (schedule.config as any).deliveryMethods.length - 1}
              deliveryMethod={item}
            />
          );
        })}{" "}
        <ScheduleWhenItem organizationSlug={props.organizationSlug} schedule={schedule} />
      </div>
    );
  }

  if (schedule.config.name === "sendSummaries") {
    return (
      <div className="text-lg leading-relaxed">
        <p className="inline">Send summaries to </p>
        {schedule.config.deliveryMethods.map((item, index) => {
          if (!item) {
            return null;
          }

          return (
            <ScheduleDeliveryMethodItem
              key={`${item.type}-${item.value}`}
              organizationSlug={props.organizationSlug}
              includeAnd={index < (schedule.config as any).deliveryMethods.length - 1}
              deliveryMethod={item}
            />
          );
        })}{" "}
        <p className="inline">of </p>
        {schedule.config.summaryFor.map((item, index) => {
          if (!item) {
            return null;
          }

          return (
            <ScheduleSummaryForItem
              key={`${item.type}-${item.value}`}
              organizationSlug={props.organizationSlug}
              includeAnd={index < (schedule.config as any).summaryFor.length - 1}
              summaryFor={item}
            />
          );
        })}{" "}
        <ScheduleWhenItem organizationSlug={props.organizationSlug} schedule={schedule} />
      </div>
    );
  }

  return null;
}

function GenerateForItem(props: {
  organizationSlug: string;
  includeAnd: boolean;
  generateFor: ScheduleConfigGenerateFor;
}) {
  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );

  if (props.generateFor.type === "organization") {
    return (
      <div className="inline">
        {props.includeAnd && <span> and </span>}
        <BuildingIcon className="size-3 mb-1 text-muted-foreground inline" /> <span>Everyone</span>
        {" (based on "}
        {props.generateFor.usingActivityFrom.map((item, index) => {
          return (
            <GenerateForUsingActivityFromItem
              key={`${item.type}${item.value}`}
              organizationSlug={props.organizationSlug}
              includeAnd={index < props.generateFor.usingActivityFrom.length - 1}
              usingActivityFrom={item}
            />
          );
        })}
        {")"}
      </div>
    );
  }

  if (props.generateFor.type === "team") {
    const team = teams.data?.find((team) => team.id === props.generateFor.value);
    if (!team) {
      return null;
    }

    return (
      <div className="inline">
        {props.includeAnd && <span> and </span>}
        <UsersIcon className="size-3 mb-1 text-muted-foreground inline" />{" "}
        <span>{team.name} team</span>
        {" (based on "}
        {props.generateFor.usingActivityFrom.map((item, index) => {
          return (
            <GenerateForUsingActivityFromItem
              key={`${item.type}${item.value}`}
              organizationSlug={props.organizationSlug}
              includeAnd={index < props.generateFor.usingActivityFrom.length - 1}
              usingActivityFrom={item}
            />
          );
        })}
        {")"}
      </div>
    );
  }

  if (props.generateFor.type === "member") {
    const member = members.data?.members.find((member) => member.id === props.generateFor.value);
    if (!member) {
      return null;
    }

    return (
      <div className="inline">
        {props.includeAnd && <span> and </span>}
        <Avatar className="size-4 translate-y-px text-[0.55rem] mr-0.5 inline-block">
          <AvatarImage
            src={typedUrl(getFileContract, {
              idOrSlug: props.organizationSlug,
              fileKey: member.user.image ?? "",
            })}
          />
          <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
        </Avatar>
        <span>{member.user.name}</span>
        {" (based on "}
        {props.generateFor.usingActivityFrom.map((item, index) => {
          return (
            <GenerateForUsingActivityFromItem
              key={`${item.type}${item.value}`}
              organizationSlug={props.organizationSlug}
              includeAnd={index < props.generateFor.usingActivityFrom.length - 1}
              usingActivityFrom={item}
            />
          );
        })}
        {")"}
      </div>
    );
  }

  return null;
}

function GenerateForUsingActivityFromItem(props: {
  organizationSlug: string;
  includeAnd: boolean;
  usingActivityFrom: ScheduleConfigUsingActivityFrom;
}) {
  const githubRepos = useQuery(
    typedQueryOptions(listGithubRepositoriesContract, { idOrSlug: props.organizationSlug }),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: props.organizationSlug }),
  );
  const discordChannels = useQuery(
    typedQueryOptions(listDiscordChannelsContract, { idOrSlug: props.organizationSlug }),
  );
  const linearTeams = useQuery(
    typedQueryOptions(listLinearTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const linearProjects = useQuery(
    typedQueryOptions(listLinearProjectsContract, { idOrSlug: props.organizationSlug }),
  );

  if (props.usingActivityFrom.type === "anyIntegration") {
    return <span>any activity{props.includeAnd && <span> and </span>}</span>;
  }

  if (props.usingActivityFrom.type === "anyGithub") {
    return (
      <span>
        any <SiGithub className="size-3 mb-1 inline" /> GitHub activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "anySlack") {
    return (
      <span>
        any <SiSlack className="size-3 mb-1 inline" /> Slack activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "anyDiscord") {
    return (
      <span>
        any <SiDiscord className="size-3 mb-1 inline" /> Discord activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "anyLinear") {
    return (
      <span>
        any <SiLinear className="size-3 mb-1 inline" /> Linear activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "githubRepository") {
    const githubRepo = githubRepos.data?.find((repo) => repo.id === props.usingActivityFrom.value);
    if (!githubRepo) {
      return null;
    }

    return (
      <span>
        activity in <SiGithub className="size-3 mb-1 inline" /> {githubRepo.name} repo
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "slackChannel") {
    const slackChannel = slackChannels.data?.find(
      (channel) => channel.id === props.usingActivityFrom.value,
    );
    if (!slackChannel) {
      return null;
    }

    return (
      <span>
        activity in <SiSlack className="size-3 mb-1 inline" /> {slackChannel.name} channel
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "discordChannel") {
    const discordChannel = discordChannels.data?.find(
      (channel) => channel.id === props.usingActivityFrom.value,
    );
    if (!discordChannel) {
      return null;
    }

    return (
      <span>
        activity in <SiDiscord className="size-3 mb-1 inline" /> {discordChannel.name} channel
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "linearTeam") {
    const team = linearTeams.data?.find((t) => t.teamId === props.usingActivityFrom.value);
    if (!team) {
      return null;
    }
    return (
      <span>
        activity in <SiLinear className="size-3 mb-1 inline" /> {team.name} team
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.usingActivityFrom.type === "linearProject") {
    const project = linearProjects.data?.find((p) => p.projectId === props.usingActivityFrom.value);
    if (!project) {
      return null;
    }
    return (
      <span>
        activity in <SiLinear className="size-3 mb-1 inline" /> {project.name} project
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  return null;
}

function ScheduleWhenItem(props: {
  organizationSlug: string;
  schedule: (typeof listSchedulesContract.$infer.output)[number];
}) {
  const { schedule } = props;

  if (schedule.config.recurrence === "daily") {
    return (
      <span>
        every day at {schedule.config.timeOfDay} ({schedule.config.timezone})
      </span>
    );
  }

  if (schedule.config.recurrence === "weekly") {
    const dayOfWeek = dayjs.weekdays()[schedule.config.dayOfWeek! + 1];
    return (
      <span>
        every week on {dayOfWeek} at {schedule.config.timeOfDay} ({schedule.config.timezone})
      </span>
    );
  }

  if (schedule.config.recurrence === "monthly") {
    const dayOfMonth = dayjs.localeData().ordinal(schedule.config.dayOfMonth! + 1);
    return (
      <span>
        every month on the {dayOfMonth.slice(1, dayOfMonth.length - 1)} day at{" "}
        {schedule.config.timeOfDay} ({schedule.config.timezone})
      </span>
    );
  }

  return null;
}

function ScheduleDeliveryMethodItem(props: {
  organizationSlug: string;
  includeAnd: boolean;
  deliveryMethod: ScheduleConfigDeliveryMethod;
}) {
  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: props.organizationSlug }),
  );
  const discordChannels = useQuery(
    typedQueryOptions(listDiscordChannelsContract, { idOrSlug: props.organizationSlug }),
  );

  if (props.deliveryMethod.type === "organization") {
    return <span>everyone's email{props.includeAnd && <span> and </span>}</span>;
  }

  if (props.deliveryMethod.type === "team") {
    const team = teams.data?.find((team) => team.id === props.deliveryMethod.value);
    if (!team) {
      return null;
    }

    return (
      <span>
        <UsersIcon className="size-3 mb-1 text-muted-foreground inline" />{" "}
        <span>everyone's email in {team.name} team</span>
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.deliveryMethod.type === "member") {
    const member = members.data?.members.find((member) => member.id === props.deliveryMethod.value);
    if (!member) {
      return null;
    }

    return (
      <span>
        <Avatar className="size-4 translate-y-px text-[0.55rem] mr-0.5 inline-block">
          <AvatarImage src={member.user.image ?? ""} />
          <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
        </Avatar>
        <span>{member.user.name}'s email</span>
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.deliveryMethod.type === "customEmail") {
    return (
      <span>
        {props.deliveryMethod.value} email{props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.deliveryMethod.type === "discordChannel") {
    const discordChannel = discordChannels.data?.find(
      (channel) => channel.id === props.deliveryMethod.value,
    );
    if (!discordChannel) {
      return null;
    }

    return (
      <span>
        <SiDiscord className="size-3 mb-1 inline" /> {discordChannel.name} channel
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.deliveryMethod.type === "slackChannel") {
    const slackChannel = slackChannels.data?.find(
      (channel) => channel.id === props.deliveryMethod.value,
    );
    if (!slackChannel) {
      return null;
    }

    return (
      <span>
        activity in <SiSlack className="size-3 mb-1 inline" /> {slackChannel.name} channel
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  return null;
}

function ScheduleSummaryForItem(props: {
  organizationSlug: string;
  includeAnd: boolean;
  summaryFor: ScheduleConfigSummaryFor;
}) {
  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );
  const githubRepos = useQuery(
    typedQueryOptions(listGithubRepositoriesContract, { idOrSlug: props.organizationSlug }),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: props.organizationSlug }),
  );
  const discordChannels = useQuery(
    typedQueryOptions(listDiscordChannelsContract, { idOrSlug: props.organizationSlug }),
  );

  if (props.summaryFor.type === "organization") {
    return <span>everyone's status updates{props.includeAnd && <span> and </span>}</span>;
  }

  if (props.summaryFor.type === "team") {
    const team = teams.data?.find((team) => team.id === props.summaryFor.value);
    if (!team) {
      return null;
    }

    return (
      <span>
        <UsersIcon className="size-3 mb-1 text-muted-foreground inline" />{" "}
        <span>everyone's status updates in {team.name} team</span>
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "member") {
    const member = members.data?.members.find((member) => member.id === props.summaryFor.value);
    if (!member) {
      return null;
    }

    return (
      <span>
        <Avatar className="size-4 translate-y-px text-[0.55rem] mr-0.5 inline-block">
          <AvatarImage src={member.user.image ?? ""} />
          <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
        </Avatar>
        <span>{member.user.name}'s status updates</span>
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "anyGithub") {
    return (
      <span>
        any <SiGithub className="size-3 mb-1 inline" /> GitHub activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "githubRepository") {
    const githubRepo = githubRepos.data?.find((repo) => repo.id === props.summaryFor.value);
    if (!githubRepo) {
      return null;
    }

    return (
      <span>
        activity in <SiGithub className="size-3 mb-1 inline" /> {githubRepo.name} repo
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "anySlack") {
    return (
      <span>
        any <SiSlack className="size-3 mb-1 inline" /> Slack activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "slackChannel") {
    const slackChannel = slackChannels.data?.find(
      (channel) => channel.id === props.summaryFor.value,
    );
    if (!slackChannel) {
      return null;
    }

    return (
      <span>
        activity in <SiSlack className="size-3 mb-1 inline" /> {slackChannel.name} channel
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "anyDiscord") {
    return (
      <span>
        any <SiDiscord className="size-3 mb-1 inline" /> Discord activity
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  if (props.summaryFor.type === "discordChannel") {
    const discordChannel = discordChannels.data?.find(
      (channel) => channel.id === props.summaryFor.value,
    );
    if (!discordChannel) {
      return null;
    }

    return (
      <span>
        activity in <SiDiscord className="size-3 mb-1 inline" /> {discordChannel.name} channel
        {props.includeAnd && <span> and </span>}
      </span>
    );
  }

  return null;
}
