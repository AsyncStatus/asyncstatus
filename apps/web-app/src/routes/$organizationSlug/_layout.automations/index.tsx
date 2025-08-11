import { listDiscordChannelsContract } from "@asyncstatus/api/typed-handlers/discord-integration";
import { listGithubRepositoriesContract } from "@asyncstatus/api/typed-handlers/github-integration";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import {
  generateScheduleContract,
  listSchedulesContract,
  runScheduleContract,
  updateScheduleContract,
} from "@asyncstatus/api/typed-handlers/schedule";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { dayjs } from "@asyncstatus/dayjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { SidebarTrigger, useSidebar } from "@asyncstatus/ui/components/sidebar";
import { Textarea } from "@asyncstatus/ui/components/textarea";
import { ArrowRightIcon, ArrowUpIcon, Loader2Icon, PencilIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { SchedulePrettyDescription } from "@/components/schedule-pretty-description";
import { ensureValidOrganization } from "@/routes/-lib/common";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/automations/")({
  component: RouteComponent,
  beforeLoad: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    await ensureValidOrganization(queryClient, organizationSlug);
  },
  loader: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    queryClient.prefetchQuery(
      typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }),
    );
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const schedules = useQuery(
    typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }),
  );
  const session = useQuery(sessionBetterAuthQueryOptions());
  const updateSchedule = useMutation(
    typedMutationOptions(updateScheduleContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug })
            .queryKey,
        });
      },
    }),
  );
  const runSchedule = useMutation(typedMutationOptions(runScheduleContract));

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb className="ml-px">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/$organizationSlug/automations" params={{ organizationSlug }}>
                      Automations
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className="py-4">
        <HeroTextarea />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {schedules.data?.map((schedule) => (
            <div
              key={schedule.id}
              className="flex flex-col gap-2 p-4 border border-border rounded-md w-full max-sm:p-2 max-sm:gap-4"
            >
              <div className="h-full">
                <SchedulePrettyDescription
                  organizationSlug={organizationSlug}
                  schedule={schedule}
                />
              </div>

              <div className="flex items-end gap-2 w-full justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        schedule.isActive ? "bg-green-500" : "bg-muted-foreground",
                      )}
                    ></div>
                    <p className="text-xs text-muted-foreground">
                      {schedule.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {schedule.createdByMember?.user.name},{" "}
                      <span
                        title={dayjs(schedule.updatedAt ?? schedule.createdAt)
                          .tz(session.data?.user.timezone ?? "UTC")
                          .format("MMM D, YYYY h:mm A")}
                      >
                        {dayjs(schedule.updatedAt ?? schedule.createdAt)
                          .tz(session.data?.user.timezone ?? "UTC")
                          .fromNow()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-center">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link
                      to="/$organizationSlug/automations/$scheduleId"
                      params={{ organizationSlug, scheduleId: schedule.id }}
                    >
                      <PencilIcon />
                      Edit
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={runSchedule.isPending}
                    onClick={() =>
                      runSchedule.mutate({
                        idOrSlug: organizationSlug,
                        scheduleId: schedule.id,
                      })
                    }
                  >
                    {runSchedule.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <>
                        Run now <ArrowUpIcon className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function HeroTextarea() {
  const { organizationSlug } = Route.useParams();
  const navigate = Route.useNavigate();
  const sidebar = useSidebar();
  const members = useQuery(typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }));
  const teams = useQuery(typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }));
  const slack = useQuery(
    typedQueryOptions(listSlackChannelsContract, { idOrSlug: organizationSlug }),
  );
  const discord = useQuery(
    typedQueryOptions(listDiscordChannelsContract, { idOrSlug: organizationSlug }),
  );
  const github = useQuery(
    typedQueryOptions(listGithubRepositoriesContract, { idOrSlug: organizationSlug }),
  );
  const [prompt, setPrompt] = useState("");
  const queryClient = useQueryClient();
  const generateSchedule = useMutation(
    typedMutationOptions(generateScheduleContract, {
      onSuccess: async (data) => {
        // Navigate to the schedule if the backend returned an id
        if (data.scheduleId) {
          await navigate({
            to: "/$organizationSlug/automations/$scheduleId",
            params: { organizationSlug, scheduleId: data.scheduleId },
          });
        }
        // Refresh schedules list
        await queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug })
            .queryKey,
        });
      },
    }),
  );
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      setIsDarkMode(e.matches);
    });
    return () => mediaQuery.removeEventListener("change", (e) => setIsDarkMode(e.matches));
  }, []);

  const firstMemberName = members.data?.members?.[0]?.user?.name ?? "a teammate";
  const firstTeamName = teams.data?.[0]?.name ?? "the Engineering team";
  const firstSlack = slack.data?.[0]?.name ? `#${slack.data[0].name}` : "#team-updates";
  const firstDiscord = discord.data?.[0]?.name ? `#${discord.data[0].name}` : "#product";
  const firstRepo = github.data?.[0]?.name ?? "our-repo";

  const examplePrompts = [
    // Simple
    `Generate updates for everyone daily at 8:00pm`,
    `Remind everyone to post updates daily at 4pm`,
    `Generate updates for ${firstMemberName} daily at 5pm`,
    `Generate updates for ${firstTeamName} every weekday at 6pm`,
    `Send weekly summaries to everyone every Monday at 8am`,

    // Channel and repo based
    `Send a weekly GitHub summary for ${firstRepo} repo to ${firstSlack} Slack channel every Monday at 9am`,
    `Send a daily Discord summary to ${firstDiscord} Discord channel at 10am`,
    `Send a monthly summary to leadership@company.com on the 1st at 9am`,

    // Using activity sources
    `Generate updates for ${firstTeamName} team every Tuesday at 3pm using any integration`,
    `Generate updates for ${firstTeamName} team at 5pm using Slack activity`,
    `Generate updates for ${firstMemberName} daily at 6pm using GitHub and Slack activity`,
    `Generate updates for everyone weekdays at 6pm using activity from ${firstSlack} Slack channel and ${firstDiscord} Discord channel`,

    // Advanced scheduling and targeting
    `Send weekly summaries for any GitHub activity to ${firstSlack} Slack channel every Friday at 4:30pm`,
    `Generate updates for everyone daily at 9am in Europe/London timezone`,
    `Send monthly summaries for ${firstRepo} repo and any Slack activity to ${firstDiscord} Discord channel on the 15th at 10am`,
  ];

  return (
    <div className="relative flex flex-col overflow-hidden justify-center rounded-2xl p-6 min-h-[400px] sm:p-8">
      <div className="absolute inset-0 z-0 bg-grid-pattern pointer-events-none" />

      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 85% 65% at 8% 8%, rgba(17, 86, 216, 0.09), transparent 60%),
            radial-gradient(ellipse 75% 60% at 75% 35%, rgba(178, 152, 220, 0.12), transparent 62%),
            radial-gradient(ellipse 70% 60% at 15% 80%, rgba(172, 172, 222, 0.2), transparent 62%),
            radial-gradient(ellipse 70% 60% at 92% 92%, rgba(229, 252, 255, 0.2), transparent 62%),
            ${isDarkMode ? "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(196, 213, 245, 0.06) 100%)" : "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(196, 213, 245, 0.1) 100%)"}
      `,
        }}
      />

      <div className="text-center space-y-4 mb-6 sm:mb-6 z-10 pt-6">
        <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Which meeting are we killing today?
        </h3>
        <p className="text-muted-foreground text-base sm:text-lg text-balance max-w-prose mx-auto">
          Tell AsyncStatus what to run and we'll make the updates, summaries, and pings happen. No
          meetings required.
        </p>
      </div>

      <div className="rounded-xl bg-card border shadow-xs overflow-hidden">
        <div className="relative z-10">
          <Textarea
            placeholder="Generate updates for everyone daily at 8:00pm"
            className="min-h-[96px] sm:min-h-[120px] resize-none border-0 focus-visible:ring-0 focus-visible:bg-white/90 dark:focus-visible:bg-black/50 focus-visible:border-border text-base sm:text-lg p-4 sm:p-4 pr-14 bg-white dark:bg-black/50 backdrop-blur-xs placeholder:text-muted-foreground"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 dark:bg-black/80"
            variant="outline"
            disabled={!prompt || generateSchedule.isPending}
            onClick={() =>
              generateSchedule.mutate({
                idOrSlug: organizationSlug,
                naturalLanguageRequest: prompt,
              })
            }
          >
            <ArrowUpIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "max-w-[calc(100vw-7rem)]",
          sidebar.state === "expanded" && "max-w-[calc(100vw-20rem)]",
        )}
      >
        <div className="flex mt-4 gap-2 w-full overflow-x-auto whitespace-nowrap touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {examplePrompts.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="shrink-0 justify-start text-left text-[0.65rem] border-none bg-white/30 dark:bg-black/20 backdrop-blur-md"
              onClick={() => setPrompt(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
