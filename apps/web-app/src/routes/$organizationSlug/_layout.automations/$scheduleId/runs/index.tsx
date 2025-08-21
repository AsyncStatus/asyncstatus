import { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { listScheduleRunsContract } from "@asyncstatus/api/typed-handlers/schedule-run";
import { dayjs } from "@asyncstatus/dayjs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@asyncstatus/ui/components/accordion";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@asyncstatus/ui/components/pagination";
import { ScrollArea } from "@asyncstatus/ui/components/scroll-area";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { ArrowRightIcon } from "@asyncstatus/ui/icons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod/v4";
import { ensureValidOrganization } from "@/routes/-lib/common";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/automations/$scheduleId/runs/")({
  component: RouteComponent,
  beforeLoad: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    await ensureValidOrganization(queryClient, organizationSlug);
  },
  validateSearch: z.object({ page: z.number().default(0), pageSize: z.number().default(25) }),
  loaderDeps: ({ search }) => ({ page: search.page, pageSize: search.pageSize }),
  loader: async ({
    params: { organizationSlug, scheduleId },
    context: { queryClient },
    deps: { page, pageSize },
  }) => {
    const [scheduleRuns, schedule] = await Promise.all([
      queryClient.ensureQueryData(
        typedQueryOptions(listScheduleRunsContract, {
          idOrSlug: organizationSlug,
          scheduleId,
          page,
          pageSize,
        }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(getScheduleContract, { idOrSlug: organizationSlug, scheduleId }),
      ),
    ]);

    return { scheduleRuns, schedule };
  },
});

function RouteComponent() {
  const { organizationSlug, scheduleId } = Route.useParams();
  const { scheduleRuns, schedule } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const { page, pageSize } = Route.useSearch();

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
                      {schedule.config.name === "generateUpdates"
                        ? "Generate updates"
                        : schedule.config.name === "remindToPostUpdates"
                          ? "Remind to post updates"
                          : schedule.config.name === "sendSummaries"
                            ? "Send summaries"
                            : "Unknown schedule"}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/$organizationSlug/automations/$scheduleId/runs"
                      params={{ organizationSlug, scheduleId }}
                    >
                      Logs
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className="py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {scheduleRuns.map((run) => (
            <Card key={run.id}>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Run</span>
                  <span className="font-mono text-xs">{shortId(run.id)}</span>
                  <Separator className="mx-1 w-px h-4" orientation="vertical" />
                  <span
                    className="text-xs text-muted-foreground"
                    title={dayjs(run.createdAt).format("MMM D, YYYY h:mm A")}
                  >
                    {dayjs(run.createdAt).fromNow()}
                  </span>
                </CardTitle>
                <CardAction className="flex items-center gap-2">
                  <Badge variant={statusToVariant(run.status)} className="capitalize">
                    {run.status}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link
                      to="/$organizationSlug/automations/$scheduleId/runs/$scheduleRunId"
                      params={{ organizationSlug, scheduleId, scheduleRunId: run.id }}
                    >
                      Open
                      <ArrowRightIcon className="ml-1" />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>

              <CardContent className="pt-4">
                {run.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks.</p>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {run.tasks.map((task, idx) => (
                      <AccordionItem key={task.id} value={task.id}>
                        <AccordionTrigger className="py-2">
                          <div className="flex w-full items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                                {humanizeKey(
                                  ((task.results as Record<string, unknown> | null)
                                    ?.type as string) ?? "Task",
                                )}{" "}
                                ({idx + 1})
                              </span>
                              <Separator className="mx-1 w-px h-4" orientation="vertical" />
                              <Badge variant={statusToVariant(task.status)} className="capitalize">
                                {task.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Attempts {task.attempts}/{task.maxAttempts}
                              </span>
                            </div>
                            <span
                              className="text-xs text-muted-foreground shrink-0"
                              title={dayjs(task.updatedAt ?? task.createdAt).format(
                                "MMM D, YYYY h:mm A",
                              )}
                            >
                              {dayjs(task.updatedAt ?? task.createdAt).fromNow()}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2">
                          {task.results ? (
                            <ScrollArea className="max-h-48 rounded-md border">
                              <div className="text-xs p-3 font-mono leading-relaxed">
                                <RenderUnknown value={task.results} />
                              </div>
                            </ScrollArea>
                          ) : (
                            <p className="text-sm text-muted-foreground">No results.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination>
            <PaginationContent className="flex items-center">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={page <= 0 ? "opacity-50 pointer-events-none" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 0) {
                      navigate({
                        to: "/$organizationSlug/automations/$scheduleId/runs",
                        params: { organizationSlug, scheduleId },
                        search: { page: Math.max(0, page - 1), pageSize },
                      });
                    }
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-xs text-muted-foreground px-2">Page {page + 1}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={
                    scheduleRuns.length < pageSize ? "opacity-50 pointer-events-none" : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    if (scheduleRuns.length >= pageSize) {
                      navigate({
                        to: "/$organizationSlug/automations/$scheduleId/runs",
                        params: { organizationSlug, scheduleId },
                        search: { page: page + 1, pageSize },
                      });
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </>
  );
}

function shortId(value: string) {
  if (value.length <= 8) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function RenderUnknown({
  value,
  mode = "container",
}: {
  value: unknown;
  mode?: "container" | "rows";
}) {
  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (value === undefined) return <span className="text-muted-foreground">undefined</span>;

  if (typeof value === "string") return <span>"{value}"</span>;
  if (typeof value === "number" || typeof value === "boolean") return <span>{String(value)}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span>[]</span>;
    if (mode === "rows") {
      return (
        <>
          {value.map((item, i) => (
            <div key={getStableKey(item)} className="contents">
              <dt className="text-muted-foreground bg-muted px-1 py-0.5 rounded-md">[{i}]</dt>
              <dd className="break-words">
                {isComplexValue(item) ? (
                  <div className="grid grid-cols-[subgrid] col-span-full gap-x-3 gap-y-1 pl-4">
                    <RenderUnknown value={item} mode="rows" />
                  </div>
                ) : (
                  <RenderUnknown value={item} />
                )}
              </dd>
            </div>
          ))}
        </>
      );
    }
    return (
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
        <RenderUnknown value={value} mode="rows" />
      </dl>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>{"{}"}</span>;
    if (mode === "rows") {
      return (
        <>
          {entries.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground bg-muted px-1 py-0.5 rounded-md">
                {humanizeKey(k)}
              </dt>
              <dd className="break-words">
                {isComplexValue(v) ? (
                  <div className="grid grid-cols-[subgrid] col-span-full gap-x-3 gap-y-1 pl-4">
                    <RenderUnknown value={v} mode="rows" />
                  </div>
                ) : (
                  <RenderUnknown value={v} />
                )}
              </dd>
            </div>
          ))}
        </>
      );
    }
    return (
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
        <RenderUnknown value={value} mode="rows" />
      </dl>
    );
  }

  try {
    return <span>{String(value)}</span>;
  } catch {
    return <span className="text-muted-foreground">[unrenderable]</span>;
  }
}

function isComplexValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return true;
  return typeof value === "object";
}

function getStableKey(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `array-${value.length}`;
  const t = typeof value;
  if (t === "object") {
    try {
      return `obj-${Object.keys(value as Record<string, unknown>).join("-")}`;
    } catch {
      return "obj";
    }
  }
  return String(value);
}

function humanizeKey(key: string): string {
  // Replace separators with space
  const spaced = key.replace(/[_-]+/g, " ");
  // Insert space before capital letters in camelCase/PascalCase
  const withCaps = spaced.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Collapse multiple spaces
  const normalized = withCaps.replace(/\s+/g, " ").trim();
  if (!normalized) return key;
  // Lowercase then capitalize first letter
  const lower = normalized.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function statusToVariant(
  status: "pending" | "running" | "partial" | "completed" | "failed" | "cancelled",
) {
  switch (status) {
    case "failed":
      return "destructive" as const;
    case "completed":
      return "default" as const;
    case "running":
      return "outline" as const;
    case "pending":
    case "cancelled":
    case "partial":
    default:
      return "secondary" as const;
  }
}
