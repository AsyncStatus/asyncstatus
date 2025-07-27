import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import type { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { SiSlack } from "@asyncstatus/ui/brand-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import {
  Bell,
  Clock,
  FileText,
  Hash,
  Mail,
  Send,
  Target,
  User,
  Users,
  Zap,
} from "@asyncstatus/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export function SchedulePrettyDescription(props: {
  organizationSlug: string;
  schedule: typeof getScheduleContract.$infer.output;
}) {
  const { schedule } = props;

  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );
  const slackChannels = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: props.organizationSlug }),
  );

  // Format action type
  const getActionDescription = () => {
    switch (schedule.actionType) {
      case "pingForUpdates":
        return "Ping for status updates";
      case "generateUpdates":
        return "Generate status updates";
      case "sendSummaries":
        return "Send summaries";
      default:
        return schedule.actionType;
    }
  };

  // Format timing
  const getTimingDescription = () => {
    const time = schedule.timeOfDay;
    const timezone = schedule.timezone.replace("_", " ");

    switch (schedule.recurrence) {
      case "daily":
        return (
          <>
            Daily at {time} <span>{timezone}</span>
          </>
        );
      case "weekly": {
        const dayNames = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const dayName =
          schedule.dayOfWeek !== undefined ? dayNames[schedule.dayOfWeek] : "Unknown day";
        return (
          <>
            Every {dayName} at {time} <span>{timezone}</span>
          </>
        );
      }
      case "monthly": {
        const dayOrdinal = schedule.dayOfMonth ? getOrdinal(schedule.dayOfMonth) : "Unknown day";
        return (
          <>
            On the {dayOrdinal} of every month at {time} <span>{timezone}</span>
          </>
        );
      }
      default:
        return (
          <>
            {schedule.recurrence} at {time} <span>{timezone}</span>
          </>
        );
    }
  };

  // Format delivery methods
  const getDeliveryMethods = () => {
    if (!schedule.deliveries?.length) return [];

    return schedule.deliveries.map((delivery) => ({
      id: delivery.id,
      icon:
        delivery.deliveryMethod === "email" ? (
          <Mail className="size-3.5 text-muted-foreground inline" />
        ) : (
          <SiSlack className="size-3.5 text-muted-foreground inline" />
        ),
      text: delivery.deliveryMethod === "email" ? "Email" : "Slack",
    }));
  };

  // Format delivery targets
  const getDeliveryTargets = () => {
    if (!schedule.deliveryTargets?.length) return [];

    return schedule.deliveryTargets.map((target) => {
      switch (target.targetType) {
        case "organization":
          return {
            id: target.id,
            icon: <Users className="size-3.5 text-muted-foreground inline" />,
            text: "Everyone",
          };
        case "team": {
          const team = teams.data?.find((t) => t.id === target.teamId);
          return {
            id: target.id,
            icon: <Users className="size-3.5 text-muted-foreground inline" />,
            text: team ? `the ${team.name} team` : "a team",
          };
        }
        case "member": {
          const member = members.data?.members?.find((m) => m.id === target.memberId);
          return {
            id: target.id,
            icon: (
              <Avatar className="size-3.5">
                <AvatarImage
                  src={typedUrl(getFileContract, {
                    idOrSlug: props.organizationSlug,
                    fileKey: member?.user.image ?? "",
                  })}
                />
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(member?.user.name ?? "")}
                </AvatarFallback>
              </Avatar>
            ),
            text: member ? member.user.name || member.user.email : "a member",
          };
        }
        case "slack_channel": {
          const channel = slackChannels.data?.find((c) => c.id === target.slackChannelId);
          return {
            id: target.id,
            icon: <Hash className="size-3.5 text-muted-foreground inline" />,
            text: channel ? `#${channel.name}` : "a Slack channel",
          };
        }
        default:
          return {
            id: target.id,
            icon: <Target className="size-3.5 text-muted-foreground inline" />,
            text: target.targetType,
          };
      }
    });
  };

  // Format targets (who the action applies to)
  const getTargets = () => {
    if (!schedule.targets?.length) return [];

    return schedule.targets.map((target) => {
      switch (target.targetType) {
        case "organization":
          return {
            id: target.id,
            icon: <Users className="size-3.5 text-muted-foreground inline" />,
            text: "Everyone",
          };
        case "team": {
          const team = teams.data?.find((t) => t.id === target.teamId);
          return {
            id: target.id,
            icon: <Users className="size-3.5 text-muted-foreground inline" />,
            text: team ? `the ${team.name} team` : "a team",
          };
        }
        case "member": {
          const member = members.data?.members?.find((m) => m.id === target.memberId);
          return {
            id: target.id,
            icon: (
              <Avatar className="size-3.5">
                <AvatarImage
                  src={typedUrl(getFileContract, {
                    idOrSlug: props.organizationSlug,
                    fileKey: member?.user.image ?? "",
                  })}
                />
                <AvatarFallback className="text-[0.5rem]">
                  {getInitials(member?.user.name ?? "")}
                </AvatarFallback>
              </Avatar>
            ),
            text: member ? member.user.name || member.user.email : "a member",
          };
        }
        default:
          return {
            id: target.id,
            icon: <Target className="size-3.5 text-muted-foreground inline" />,
            text: target.targetType,
          };
      }
    });
  };

  const getOrdinal = (n: number): string => {
    const suffixes = ["th", "st", "nd", "rd"];
    const remainder = n % 100;
    return n + (suffixes?.[(remainder - 20) % 10] ?? suffixes?.[remainder] ?? suffixes?.[0] ?? "");
  };

  const renderList = (items: Array<{ id: string; icon: React.ReactNode; text: string }>) => {
    if (!items || items.length === 0) return null;
    if (items.length === 1) {
      const firstItem = items[0];
      if (!firstItem) return null;
      return (
        <span className="inline-flex items-center gap-1">
          {firstItem.icon}
          {firstItem.text}
        </span>
      );
    }

    const lastItem = items[items.length - 1];
    if (!lastItem) return null;

    return (
      <>
        {items.slice(0, -1).map((item, index) => (
          <span key={item.id} className="inline-flex items-center gap-1">
            {item.icon}
            {item.text}
            {index < items.length - 2 && ", "}
          </span>
        ))}
        <span> and </span>
        <span key={lastItem.id} className="inline-flex items-center gap-1">
          {lastItem.icon}
          {lastItem.text}
        </span>
      </>
    );
  };

  const actionIcon = (() => {
    switch (schedule.actionType) {
      case "pingForUpdates":
        return <Bell className="size-3.5 text-muted-foreground inline" />;
      case "generateUpdates":
        return <Zap className="size-3.5 text-muted-foreground inline" />;
      case "sendSummaries":
        return <FileText className="size-3.5 text-muted-foreground inline" />;
      default:
        return <Target className="size-3.5 text-muted-foreground inline" />;
    }
  })();

  const deliveryMethods = getDeliveryMethods();
  const deliveryTargets = getDeliveryTargets();
  const targets = getTargets();

  return (
    <div className="text-lg leading-relaxed space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {actionIcon}
        <span>{getActionDescription()}</span>
        {targets.length > 0 && (
          <>
            <span>for</span>
            {renderList(targets)}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <span>{getTimingDescription()}</span>
      </div>

      {deliveryMethods.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Send className="size-3.5 text-muted-foreground" />
          <span>via</span>
          {renderList(deliveryMethods)}
        </div>
      )}

      {deliveryTargets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Target className="size-3.5 text-muted-foreground" />
          <span>to</span>
          {renderList(deliveryTargets)}
        </div>
      )}
    </div>
  );
}
