import {
  deleteScheduleContract,
  getScheduleContract,
  listSchedulesContract,
  updateScheduleContract,
} from "@asyncstatus/api/typed-handlers/schedule";
import { listSlackChannelsContract } from "@asyncstatus/api/typed-handlers/slack-integration";
import { dayjs } from "@asyncstatus/dayjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { TrashIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { UpdateScheduleForm } from "@/components/update-schedule-form/update-schedule-form";
import { ensureValidOrganization } from "@/routes/-lib/common";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/automations/$scheduleId")({
  component: RouteComponent,
  beforeLoad: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    await ensureValidOrganization(queryClient, organizationSlug);
  },
  loader: async ({ params: { organizationSlug, scheduleId }, context: { queryClient } }) => {
    queryClient.prefetchQuery(
      typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(getScheduleContract, { idOrSlug: organizationSlug, scheduleId }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(
        listSlackChannelsContract,
        { idOrSlug: organizationSlug },
        { throwOnError: false },
      ),
    );
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const { organizationSlug, scheduleId } = Route.useParams();
  const schedule = useQuery(
    typedQueryOptions(getScheduleContract, { idOrSlug: organizationSlug, scheduleId }),
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
  const deleteSchedule = useMutation(
    typedMutationOptions(deleteScheduleContract, {
      onSuccess: () => {
        queryClient.setQueryData(
          typedQueryOptions(listSchedulesContract, { idOrSlug: organizationSlug }).queryKey,
          (old) => {
            if (!old) return old;
            return old.filter((schedule) => schedule.id !== scheduleId);
          },
        );
        navigate({ to: "/$organizationSlug/automations" });
        queryClient.invalidateQueries(
          typedQueryOptions(getScheduleContract, { idOrSlug: organizationSlug, scheduleId }),
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
                    <Link to="/$organizationSlug/automations" params={{ organizationSlug }}>
                      Automations
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/$organizationSlug/automations/$scheduleId"
                      params={{ organizationSlug, scheduleId }}
                    >
                      {schedule.data?.config.name === "generateUpdates"
                        ? "Generate updates"
                        : schedule.data?.config.name === "remindToPostUpdates"
                          ? "Remind to post updates"
                          : schedule.data?.config.name === "sendSummaries"
                            ? "Send summaries"
                            : ""}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteSchedule.mutate({ idOrSlug: organizationSlug, scheduleId })}
            >
              <TrashIcon />
              Delete
            </Button>
            <Button
              size="sm"
              variant={schedule.data?.isActive ? "outline" : "default"}
              onClick={() => {
                updateSchedule.mutate({
                  idOrSlug: organizationSlug,
                  scheduleId: schedule.data?.id,
                  name: schedule.data?.name,
                  config: schedule.data?.config,
                  isActive: !schedule.data?.isActive,
                });
              }}
            >
              {schedule.data?.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      </header>

      <div className="py-4">
        {schedule.isPending && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!schedule.isPending && schedule.data && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    schedule.data.isActive ? "bg-green-500" : "bg-muted-foreground",
                  )}
                ></div>
                <p className="text-xs text-muted-foreground">
                  {schedule.data.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {schedule.data.createdByMember?.user.name},{" "}
                  <span
                    title={dayjs(schedule.data.updatedAt ?? schedule.data.createdAt)
                      .tz(session.data?.user.timezone ?? "UTC")
                      .format("MMM D, YYYY h:mm A")}
                  >
                    {dayjs(schedule.data.updatedAt ?? schedule.data.createdAt)
                      .tz(session.data?.user.timezone ?? "UTC")
                      .fromNow()}
                  </span>
                </p>
              </div>
            </div>

            <UpdateScheduleForm
              organizationSlug={organizationSlug}
              scheduleId={schedule.data?.id}
            />
          </>
        )}
      </div>
    </>
  );
}
