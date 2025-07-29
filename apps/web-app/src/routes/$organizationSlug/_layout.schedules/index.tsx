import {
  createScheduleContract,
  getScheduleContract,
  listSchedulesContract,
  updateScheduleContract,
} from "@asyncstatus/api/typed-handlers/schedule";
import { dayjs } from "@asyncstatus/dayjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { CalendarDaysIcon, PencilIcon, PlusIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { EmptyState } from "@/components/empty-state";
import { SchedulePrettyDescription } from "@/components/schedule-pretty-description";
import { ensureValidOrganization } from "@/routes/-lib/common";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/schedules/")({
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
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const schedules = useQuery(
    typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }),
  );
  const session = useQuery(sessionBetterAuthQueryOptions());
  const updateSchedule = useMutation(
    typedMutationOptions(updateScheduleContract, {
      onSuccess: (data) => {
        queryClient.setQueryData(
          typedQueryOptions(getScheduleContract, {
            idOrSlug: organizationSlug,
            scheduleId: data.id,
          }).queryKey,
          data,
        );
        queryClient.setQueryData(
          typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }).queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((schedule) => (schedule.id === data.id ? data : schedule));
          },
        );
      },
    }),
  );
  const createSchedule = useMutation(
    typedMutationOptions(createScheduleContract, {
      onSuccess: async (data) => {
        queryClient.setQueryData(
          typedQueryOptions(getScheduleContract, {
            idOrSlug: organizationSlug,
            scheduleId: data.id,
          }).queryKey,
          data,
        );
        await navigate({
          to: "/$organizationSlug/schedules/$scheduleId",
          params: { organizationSlug, scheduleId: data.id },
        });
        queryClient.setQueryData(
          typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }).queryKey,
          (oldData) => {
            return [...(oldData ?? []), data];
          },
        );
      },
    }),
  );

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
                    <Link to="/$organizationSlug/schedules" params={{ organizationSlug }}>
                      Schedules
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() =>
                createSchedule.mutate({
                  idOrSlug: organizationSlug,
                  name: "remindToPostUpdates",
                  config: {
                    name: "remindToPostUpdates",
                    timeOfDay: "09:30",
                    timezone: session.data?.user.timezone ?? "UTC",
                    recurrence: "daily",
                    deliverToEveryone: true,
                    deliveryMethods: [],
                  },
                  isActive: false,
                })
              }
            >
              <PlusIcon />
              New schedule
            </Button>
          </div>
        </div>
      </header>

      <div className="py-4">
        {schedules.data?.length === 0 && (
          <EmptyState
            title="No schedules found"
            description="You can create a schedule to send a recurring summary delivery of status updates or ping anyone for status updates."
            icon={<CalendarDaysIcon className="size-10" />}
          >
            <Button
              size="sm"
              onClick={() =>
                createSchedule.mutate({
                  idOrSlug: organizationSlug,
                  name: "remindToPostUpdates",
                  config: {
                    name: "remindToPostUpdates",
                    timeOfDay: "09:30",
                    timezone: session.data?.user.timezone ?? "UTC",
                    recurrence: "daily",
                    deliverToEveryone: true,
                    deliveryMethods: [],
                  },
                  isActive: false,
                })
              }
            >
              <PlusIcon />
              New schedule
            </Button>
          </EmptyState>
        )}

        <div className="flex flex-col gap-2">
          {schedules.data?.map((schedule) => (
            <div
              key={schedule.id}
              className="flex flex-col gap-2 p-4 border border-border rounded-md w-full max-sm:p-2 max-sm:gap-4"
            >
              <SchedulePrettyDescription organizationSlug={organizationSlug} schedule={schedule} />

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
                      to="/$organizationSlug/schedules/$scheduleId"
                      params={{ organizationSlug, scheduleId: schedule.id }}
                    >
                      <PencilIcon />
                      Edit
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    className="flex-1"
                    variant={schedule.isActive ? "outline" : "default"}
                    onClick={() =>
                      updateSchedule.mutate({
                        idOrSlug: organizationSlug,
                        scheduleId: schedule.id,
                        name: schedule.name,
                        config: schedule.config,
                        isActive: !schedule.isActive,
                      })
                    }
                  >
                    {schedule.isActive ? "Deactivate" : "Activate"}
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
