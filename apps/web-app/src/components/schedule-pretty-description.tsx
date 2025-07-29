import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import type { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { SiSlack } from "@asyncstatus/ui/brand-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Bell, Clock, FileText, Send, Target, Users, Zap } from "@asyncstatus/ui/icons";
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
    switch (schedule.config.name) {
      case "remindToPostUpdates":
        return "Remind to post updates";
      case "generateUpdates":
        return "Generate updates";
      case "sendSummaries":
        return "Send update summaries";
      default:
        return "Unknown action";
    }
  };

  // Format timing
  const getTimingDescription = () => {
    const time = schedule.config.timeOfDay;
    const timezone = schedule.config.timezone.replace("_", " ");

    switch (schedule.config.recurrence) {
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
          schedule.config.dayOfWeek !== undefined
            ? dayNames[schedule.config.dayOfWeek]
            : "Unknown day";
        return (
          <>
            Every {dayName} at {time} <span>{timezone}</span>
          </>
        );
      }
      case "monthly": {
        const dayOrdinal = schedule.config.dayOfMonth
          ? getOrdinal(schedule.config.dayOfMonth)
          : "Unknown day";
        return (
          <>
            On the {dayOrdinal} of every month at {time} <span>{timezone}</span>
          </>
        );
      }
      default:
        return (
          <>
            {schedule.config.recurrence} at {time} <span>{timezone}</span>
          </>
        );
    }
  };

  // Format delivery methods
  const getDeliveryMethods = () => {
    if (
      schedule.config.name === "remindToPostUpdates" ||
      schedule.config.name === "sendSummaries"
    ) {
      return schedule.config.deliveryMethods.map((delivery) => {
        if (!delivery) return null;

        const member = members.data?.members.find((m) => m.id === delivery.value);
        const team = teams.data?.find((t) => t.id === delivery.value);
        const slackChannel = slackChannels.data?.find((c) => c.id === delivery.value);

        return {
          id: delivery.value,
          icon:
            delivery.type === "member" ? (
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
            ) : delivery.type === "team" ? (
              <Users className="size-3.5 text-muted-foreground inline" />
            ) : delivery.type === "slack" ? (
              <SiSlack className="size-3.5 text-muted-foreground inline" />
            ) : (
              <Target className="size-3.5 text-muted-foreground inline" />
            ),
          text:
            delivery.type === "member"
              ? member?.user.email
              : delivery.type === "team"
                ? team?.name
                : slackChannel?.name,
        };
      });
    }
  };

  const getTargets = () => {
    if (schedule.config.name === "generateUpdates") {
      return schedule.config.generateFor.map((generateFor) => {
        if (!generateFor) return null;

        const member = members.data?.members.find((m) => m.id === generateFor.value);
        const team = teams.data?.find((t) => t.id === generateFor.value);

        return {
          id: generateFor.value,
          icon:
            generateFor.type === "member" ? (
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
            ) : generateFor.type === "team" ? (
              <Users className="size-3.5 text-muted-foreground inline" />
            ) : (
              <Target className="size-3.5 text-muted-foreground inline" />
            ),
          text:
            generateFor.type === "member"
              ? member?.user.name
              : generateFor.type === "team"
                ? team?.name
                : "unknown",
        };
      });
    }
  };

  const getOrdinal = (n: number): string => {
    const suffixes = ["th", "st", "nd", "rd"];
    const remainder = n % 100;
    return n + (suffixes?.[(remainder - 20) % 10] ?? suffixes?.[remainder] ?? suffixes?.[0] ?? "");
  };

  const renderList = (
    items: Array<{ id: string; icon: React.ReactNode; text: string | undefined } | null>,
  ) => {
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
          <span key={item?.id} className="inline-flex items-center gap-1">
            {item?.icon}
            {item?.text}
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
    switch (schedule.config.name) {
      case "remindToPostUpdates":
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
  const targets = getTargets();

  return (
    <div className="text-lg leading-relaxed space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {actionIcon}
        <span>{getActionDescription()}</span>
        {targets && targets.length > 0 && (
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

      {deliveryMethods && deliveryMethods.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Send className="size-3.5 text-muted-foreground" />
          <span>via</span>
          {renderList(deliveryMethods)}
        </div>
      )}
    </div>
  );
}
