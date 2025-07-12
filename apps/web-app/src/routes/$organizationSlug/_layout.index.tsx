import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listStatusUpdatesByDateContract } from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
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
import { CalendarIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { CircleHelpIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { z } from "zod/v4";
import { EmptyState } from "@/components/empty-state";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";
import { ensureValidOrganization } from "../-lib/common";

export const Route = createFileRoute("/$organizationSlug/_layout/")({
  validateSearch: z.object({ date: z.string().optional() }),
  loaderDeps: ({ search: { date } }) => ({ date }),
  loader: async ({ context: { queryClient }, params: { organizationSlug }, deps: { date } }) => {
    const [organization, statusUpdates] = await Promise.all([
      ensureValidOrganization(queryClient, organizationSlug),
      queryClient.ensureQueryData(
        typedQueryOptions(listStatusUpdatesByDateContract, {
          idOrSlug: organizationSlug,
          date: date ?? dayjs().format("YYYY-MM-DD"),
        }),
      ),
    ]);
    return { organization, statusUpdates };
  },
  head: async ({ loaderData }) => {
    return {
      meta: [
        {
          title: `Status updates - ${loaderData?.organization.organization.name} - AsyncStatus`,
        },
      ],
    };
  },
  component: RouteComponent,
});

type StatusUpdateItem = {
  id: string;
  content: string;
  isBlocker: boolean;
  isInProgress?: boolean;
  order: number;
};

type StatusUpdate = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string;
  emoji?: string;
  mood?: string;
  notes?: string;
  isDraft: boolean;
  timezone?: string;
  member: {
    id: string;
    user: {
      name: string;
      email: string;
      image?: string;
    };
  };
  team?: {
    id: string;
    name: string;
  };
  items: StatusUpdateItem[];
};

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const { date } = Route.useSearch({
    select: (search) => ({
      date: search.date
        ? dayjs(search.date, "YYYY-MM-DD").format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
    }),
  });
  const navigate = Route.useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { statusUpdates } = Route.useLoaderData();
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      navigate({ search: { date: dayjs(date).format("YYYY-MM-DD") } });
      setIsCalendarOpen(false);
    }
  };

  const renderStatusUpdateItem = (item: StatusUpdateItem) => {
    const getItemStyle = () => {
      if (item.isBlocker) {
        return {
          color: "color-mix(in oklab, hsl(var(--destructive)) 70%, hsl(var(--foreground)) 30%)",
        };
      }
      if (!item.isInProgress && !item.isBlocker) {
        return {
          color: "color-mix(in oklab, hsl(142.1 76.2% 36.3%) 65%, hsl(var(--foreground)) 35%)",
        };
      }
      if (item.isInProgress && !item.isBlocker) {
        return {
          color: "color-mix(in oklab, hsl(32.1 94.6% 43.7%) 70%, hsl(var(--foreground)) 30%)",
        };
      }
      return {};
    };

    return (
      <span key={item.id} className="inline" style={getItemStyle()}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <span>{children}</span>,
            strong: ({ children }) => <strong>{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
            code: ({ children }) => (
              <code className="bg-muted rounded px-1 py-0.5 text-xs">{children}</code>
            ),
          }}
        >
          {item.content}
        </Markdown>
      </span>
    );
  };

  const typedStatusUpdates = statusUpdates as unknown as StatusUpdate[] | undefined;

  const groupedByMember = typedStatusUpdates?.reduce(
    (acc: Record<string, StatusUpdate[]>, update: StatusUpdate) => {
      const memberId = update.member.id;
      if (!acc[memberId]) {
        acc[memberId] = [];
      }
      acc[memberId].push(update);
      return acc;
    },
    {} as Record<string, StatusUpdate[]>,
  );

  return (
    <>
      <header className="flex flex-col gap-4 pb-4">
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
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal sm:w-[240px]",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date ? dayjs(date, "YYYY-MM-DD").toDate() : undefined}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link
              to="/$organizationSlug/status-update"
              params={{ organizationSlug }}
              className="flex items-center justify-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New status update</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6">
        {groupedByMember && Object.keys(groupedByMember).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByMember).map(([memberId, updates]) => {
              // Combine all items from all updates for this member
              const allItems = updates.flatMap((update: StatusUpdate) =>
                update.items.sort((a: StatusUpdateItem, b: StatusUpdateItem) => a.order - b.order),
              );
              const displayItems = allItems.slice(0, 3);
              const remainingCount = allItems.length - 3;

              // Guard against empty updates array
              if (updates.length === 0) return null;

              const memberInfo = updates[0]?.member;
              const mostRecentUpdate = updates[0];

              if (!memberInfo || !mostRecentUpdate) return null;

              return (
                <div
                  key={memberId}
                  className="prose prose-neutral prose-lg dark:prose-invert flex max-w-full flex-wrap items-start gap-2"
                >
                  <Avatar className="not-prose size-10 shrink-0">
                    <AvatarImage
                      src={
                        memberInfo.user.image
                          ? typedUrl(getFileContract, {
                              idOrSlug: organizationSlug,
                              fileKey: memberInfo.user.image,
                            })
                          : undefined
                      }
                      alt={memberInfo.user.name}
                    />
                    <AvatarFallback>{getInitials(memberInfo.user.name)}</AvatarFallback>
                  </Avatar>

                  <div className="mt-1 inline flex-1">
                    <span className="font-medium">{memberInfo.user.name.split(" ")[0]} </span>
                    {mostRecentUpdate?.emoji && (
                      <span role="img" aria-label="mood">
                        {mostRecentUpdate.emoji}{" "}
                      </span>
                    )}
                    {mostRecentUpdate?.team && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {mostRecentUpdate.team.name}
                      </Badge>
                    )}
                    {displayItems.map((item: StatusUpdateItem, index: number) => (
                      <span key={item.id}>
                        {renderStatusUpdateItem(item)}
                        {index < displayItems.length - 1 && (
                          <span className="text-muted-foreground">, </span>
                        )}
                      </span>
                    ))}{" "}
                    {remainingCount > 0 && (
                      <Link
                        to="/$organizationSlug/status-update/$statusUpdateId"
                        params={{
                          organizationSlug,
                          statusUpdateId: mostRecentUpdate.id,
                        }}
                        className="hover:underline"
                      >
                        and {remainingCount} more
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CircleHelpIcon className="h-10 w-10" />}
            title={`No status updates for ${format(date, "PPP")}`}
            description="Try selecting a different date or create a new status update."
            action={
              <Button asChild>
                <Link
                  to="/$organizationSlug/status-update"
                  params={{ organizationSlug }}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  New status update
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}
