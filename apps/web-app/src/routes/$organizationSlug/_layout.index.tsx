import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import {
  generateStatusUpdateContract,
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { dayjs, formatRelativeTime } from "@asyncstatus/dayjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { Calendar } from "@asyncstatus/ui/components/calendar";
import { Label } from "@asyncstatus/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { CalendarIcon, CircleDashed, FilterIcon, SparklesIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import { z } from "zod/v4";
import { EmptyState } from "@/components/empty-state";
import { MemberSelect } from "@/components/member-select";
import { StatusUpdateCard, StatusUpdateCardSkeleton } from "@/components/status-update-card";
import { TeamSelect } from "@/components/team-select";
import { WriteStatusUpdateButton } from "@/components/write-status-update-button";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { ensureValidOrganization } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/")({
  validateSearch: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .default(dayjs().startOf("day").format("YYYY-MM-DD")),
    memberId: z.string().optional(),
    teamId: z.string().optional(),
  }),
  search: {
    middlewares: [
      ({ search, next }) => {
        if (!search.date) {
          return next({
            date: dayjs().startOf("day").format("YYYY-MM-DD"),
            memberId: search.memberId,
            teamId: search.teamId,
          });
        }
        return next({ date: search.date, memberId: search.memberId, teamId: search.teamId });
      },
    ],
  },
  beforeLoad: ({
    context: { queryClient },
    params: { organizationSlug },
    search: { date, memberId, teamId },
  }) => {
    queryClient.prefetchQuery(
      typedQueryOptions(listStatusUpdatesByDateContract, {
        idOrSlug: organizationSlug,
        date: date,
        memberId: memberId,
        teamId: teamId,
      }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(
        getStatusUpdateContract,
        { idOrSlug: organizationSlug, statusUpdateIdOrDate: date },
        { throwOnError: false },
      ),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(
        getMemberStatusUpdateContract,
        { idOrSlug: organizationSlug, statusUpdateIdOrDate: date },
        { throwOnError: false },
      ),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }),
    );
    queryClient.prefetchQuery(typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }));
  },
  loader: async ({ context: { queryClient }, params: { organizationSlug } }) => {
    const organization = await ensureValidOrganization(queryClient, organizationSlug);
    return { organization };
  },
  head: async ({ loaderData }) => {
    return {
      meta: [
        { title: `Status updates - ${loaderData?.organization.organization.name} - AsyncStatus` },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const navigate = Route.useNavigate();
  const { date, memberId, teamId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const memberFilterId = useId();
  const teamFilterId = useId();

  const now = useMemo(() => dayjs(), []);
  const isSevenDaysAgo = useMemo(() => now.diff(dayjs(date), "day") >= 7, [date, now]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      navigate({ search: { date: dayjs(date).format("YYYY-MM-DD") } });
      setIsCalendarOpen(false);
    }
  };

  const statusUpdatesByDate = useQuery(
    typedQueryOptions(listStatusUpdatesByDateContract, {
      idOrSlug: organizationSlug,
      date,
      memberId,
      teamId,
    }),
  );

  const generateStatusUpdate = useMutation(
    typedMutationOptions(generateStatusUpdateContract, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listStatusUpdatesByDateContract, {
            idOrSlug: organizationSlug,
            date: dayjs.utc(data.effectiveFrom).format("YYYY-MM-DD"),
          }).queryKey,
        });
        navigate({
          to: "/$organizationSlug/status-updates/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
        });
      },
    }),
  );

  return (
    <>
      <header className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between gap-0">
          <div className="flex items-center w-full">
            <div className="flex items-center max-sm:flex-1 max-sm:w-full">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/$organizationSlug" params={{ organizationSlug }}>
                        Status updates
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "ml-4 justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatRelativeTime(date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    autoFocus
                    mode="single"
                    selected={dayjs.utc(date, "YYYY-MM-DD").toDate()}
                    onSelect={handleDateSelect}
                    className="rounded-md border shadow-sm"
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="relative">
                    {(memberId || teamId) && (
                      <div className="absolute -right-1 -top-1 size-3.5 rounded-full bg-primary text-[0.65rem] flex items-center justify-center text-primary-foreground">
                        {[memberId, teamId].filter(Boolean).length}
                      </div>
                    )}
                    <FilterIcon className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent sideOffset={14} className="p-4 bg-background max-sm:w-screen">
                  <p className="text-base font-medium mb-4">Filters</p>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={memberFilterId}>User</Label>
                      <MemberSelect
                        id={memberFilterId}
                        organizationSlug={organizationSlug}
                        value={memberId}
                        onSelect={(value) => {
                          navigate({
                            search: {
                              date,
                              memberId: value === memberId ? undefined : value,
                              teamId,
                            },
                            replace: true,
                          });
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={teamFilterId}>Team</Label>
                      <TeamSelect
                        id={teamFilterId}
                        organizationSlug={organizationSlug}
                        value={teamId}
                        onSelect={(value) => {
                          navigate({
                            search: {
                              date,
                              memberId,
                              teamId: value === teamId ? undefined : value,
                            },
                            replace: true,
                          });
                        }}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-sm:hidden">
            <div className="flex gap-2">
              <WriteStatusUpdateButton organizationSlug={organizationSlug} date={date} />

              <Button
                size="sm"
                disabled={generateStatusUpdate.isPending}
                onClick={() =>
                  generateStatusUpdate.mutate({
                    idOrSlug: organizationSlug,
                    effectiveFrom: dayjs.utc(date).startOf("day").toISOString(),
                    effectiveTo: dayjs.utc(date).endOf("day").toISOString(),
                  })
                }
              >
                <SparklesIcon className="h-4 w-4" />
                <span>{generateStatusUpdate.isPending ? "Generating..." : "Generate update"}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex gap-2 pb-4 sm:hidden">
        <WriteStatusUpdateButton
          organizationSlug={organizationSlug}
          date={date}
          className="flex-1"
        />

        <Button
          size="sm"
          className="flex-1"
          disabled={generateStatusUpdate.isPending}
          onClick={() =>
            generateStatusUpdate.mutate({
              idOrSlug: organizationSlug,
              effectiveFrom: dayjs.utc(date).startOf("day").toISOString(),
              effectiveTo: dayjs.utc(date).endOf("day").toISOString(),
            })
          }
        >
          <SparklesIcon className="h-4 w-4" />
          <span>{generateStatusUpdate.isPending ? "Generating..." : "Generate update"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {statusUpdatesByDate.isPending && <StatusUpdateCardSkeleton count={5} />}

        {statusUpdatesByDate.data?.length === 0 && (
          <EmptyState
            className="col-span-full"
            icon={<CircleDashed className="size-10" />}
            title={`No updates for ${isSevenDaysAgo ? formatRelativeTime(date) : formatRelativeTime(date).toLowerCase()}`}
            description="Try selecting a different date, team or user, writing a new update manually or generating one from your activity."
          >
            <div className="flex items-center justify-center gap-2">
              <WriteStatusUpdateButton organizationSlug={organizationSlug} date={date} />

              <Button
                size="sm"
                disabled={generateStatusUpdate.isPending}
                onClick={() =>
                  generateStatusUpdate.mutate({
                    idOrSlug: organizationSlug,
                    effectiveFrom: dayjs.utc(date).startOf("day").toISOString(),
                    effectiveTo: dayjs.utc(date).endOf("day").toISOString(),
                  })
                }
              >
                <SparklesIcon className="h-4 w-4" />
                <span>{generateStatusUpdate.isPending ? "Generating..." : "Generate update"}</span>
              </Button>
            </div>
          </EmptyState>
        )}

        {statusUpdatesByDate.data?.map((statusUpdate) => (
          <StatusUpdateCard
            key={statusUpdate.id}
            statusUpdate={statusUpdate}
            organizationSlug={organizationSlug}
          />
        ))}
      </div>
    </>
  );
}
