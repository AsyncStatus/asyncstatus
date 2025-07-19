import {
  generateStatusUpdateContract,
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs, formatRelativeTime } from "@asyncstatus/dayjs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { Calendar } from "@asyncstatus/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import {
  ArrowRightIcon,
  CalendarIcon,
  CircleDashed,
  PlusIcon,
  SparklesIcon,
} from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod/v4";
import { EmptyState } from "@/components/empty-state";
import { StatusUpdateCard, StatusUpdateCardSkeleton } from "@/components/status-update-card";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { ensureValidOrganization } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/")({
  validateSearch: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .default(dayjs().format("YYYY-MM-DD")),
  }),
  search: {
    middlewares: [
      ({ search, next }) => {
        if (!search.date) {
          return next({ date: dayjs().format("YYYY-MM-DD") });
        }
        return next({ date: search.date });
      },
    ],
  },
  beforeLoad: async ({
    context: { queryClient },
    params: { organizationSlug },
    search: { date },
  }) => {
    queryClient.prefetchQuery(
      typedQueryOptions(listStatusUpdatesByDateContract, {
        idOrSlug: organizationSlug,
        date: date,
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
  const { date } = Route.useSearch({ select: (search) => ({ date: search.date }) });
  const queryClient = useQueryClient();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const now = useMemo(() => dayjs(), []);
  const isSevenDaysAgo = useMemo(() => now.diff(dayjs(date), "day") >= 7, [date, now]);
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      navigate({ search: { date: dayjs(date).format("YYYY-MM-DD") } });
      setIsCalendarOpen(false);
    }
  };

  const statusUpdate = useQuery(
    typedQueryOptions(
      getMemberStatusUpdateContract,
      { idOrSlug: organizationSlug, statusUpdateIdOrDate: date },
      { throwOnError: false },
    ),
  );

  const statusUpdatesByDate = useQuery(
    typedQueryOptions(listStatusUpdatesByDateContract, {
      idOrSlug: organizationSlug,
      date: date,
    }),
  );

  const generateStatusUpdate = useMutation(
    typedMutationOptions(generateStatusUpdateContract, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listStatusUpdatesByDateContract, {
            idOrSlug: organizationSlug,
            date: dayjs(data.effectiveFrom).format("YYYY-MM-DD"),
          }).queryKey,
        });
        navigate({
          to: "/$organizationSlug/status-update/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
        });
      },
    }),
  );

  return (
    <>
      <header className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between gap-0">
          <div className="flex items-center gap-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Status updates</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "ml-4 w-full justify-start text-left font-normal sm:w-auto",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatRelativeTime(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dayjs(date, "YYYY-MM-DD").toDate()}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link
                  to="/$organizationSlug/status-update"
                  params={{ organizationSlug }}
                  className="flex items-center justify-center gap-2"
                >
                  {statusUpdate.data?.id && statusUpdate.data?.isDraft && (
                    <>
                      <ArrowRightIcon className="h-4 w-4" />
                      <span>Continue writing</span>
                    </>
                  )}
                  {statusUpdate.data?.id && !statusUpdate.data?.isDraft && (
                    <>
                      <ArrowRightIcon className="h-4 w-4" />
                      <span>Edit update</span>
                    </>
                  )}
                  {!statusUpdate.data && (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      <span>Write update</span>
                    </>
                  )}
                </Link>
              </Button>

              <Button
                size="sm"
                className="w-full sm:w-auto"
                disabled={generateStatusUpdate.isPending}
                onClick={() =>
                  generateStatusUpdate.mutate({
                    idOrSlug: organizationSlug,
                    effectiveFrom: dayjs(date).startOf("day").toDate(),
                    effectiveTo: dayjs(date).endOf("day").toDate(),
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {statusUpdatesByDate.isPending && <StatusUpdateCardSkeleton count={5} />}

        {statusUpdatesByDate.data?.length === 0 && (
          <EmptyState
            className="col-span-full"
            icon={<CircleDashed className="size-10" />}
            title={`No updates for ${isSevenDaysAgo ? formatRelativeTime(date) : formatRelativeTime(date).toLowerCase()}`}
            description="Try selecting a different date, writing a new update manually or generating one from your activity."
          >
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                <Link
                  to="/$organizationSlug/status-update"
                  params={{ organizationSlug }}
                  className="flex items-center justify-center gap-2"
                >
                  {statusUpdate.data?.id && (
                    <>
                      <ArrowRightIcon className="h-4 w-4" />
                      <span>Continue writing</span>
                    </>
                  )}
                  {!statusUpdate.data?.id && (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      <span>Write update</span>
                    </>
                  )}
                </Link>
              </Button>

              <Button
                size="sm"
                className="w-full sm:w-auto"
                disabled={generateStatusUpdate.isPending}
                onClick={() =>
                  generateStatusUpdate.mutate({
                    idOrSlug: organizationSlug,
                    effectiveFrom: dayjs(date).startOf("day").toDate(),
                    effectiveTo: dayjs(date).endOf("day").toDate(),
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
