import type { StatusUpdateItem } from "@asyncstatus/api/db/status-update-item";
import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import type { listStatusUpdatesByDateContract } from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@asyncstatus/ui/components/tooltip";
import { AlertTriangle } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { getInitials } from "@/lib/utils";
import { typedQueryOptions, typedUrl } from "@/typed-handlers";

export type StatusUpdateCardProps = {
  statusUpdate: (typeof listStatusUpdatesByDateContract.$infer.output)[number];
};

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

export function StatusUpdateCard(props: StatusUpdateCardProps) {
  const navigate = useNavigate();
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, {
      idOrSlug: props.statusUpdate.organizationId,
    }),
  );
  const isStatusUpdateOwner = useMemo(
    () => props.statusUpdate.member.id === organization.data?.member.id,
    [props.statusUpdate.member.id, organization.data?.member.id],
  );
  const navigateOnClick = useCallback(
    (_: unknown) => {
      if (isStatusUpdateOwner) {
        navigate({
          to: "/$organizationSlug/status-update",
          params: { organizationSlug: props.statusUpdate.organizationId },
        });
        return;
      }
      navigate({
        to: "/$organizationSlug/status-update/$statusUpdateId",
        params: {
          organizationSlug: props.statusUpdate.organizationId,
          statusUpdateId: props.statusUpdate.id,
        },
      });
    },
    [navigate, props.statusUpdate.organizationId, props.statusUpdate.id, isStatusUpdateOwner],
  );
  const name = useMemo(
    () => props.statusUpdate.member.user.name.split(" ")[0] ?? props.statusUpdate.member.user.name,
    [props.statusUpdate.member.user.name],
  );
  const hasAnyBlockers = useMemo(
    () => props.statusUpdate.items.some((item) => item.isBlocker),
    [props.statusUpdate.items],
  );
  const updateStatusItemsText = useMemo(
    () => getUpdateStatusItemsText(props.statusUpdate.items),
    [props.statusUpdate.items],
  );

  return (
    <div className="border border-border rounded-lg">
      <header className="p-3.5">
        {hasAnyBlockers && (
          <button
            type="button"
            className="flex items-center gap-2 mb-1 bg-destructive/10 hover:bg-destructive/20 p-1 rounded-sm w-full cursor-pointer"
            onClick={navigateOnClick}
          >
            <AlertTriangle className="size-3 text-destructive" />
            <p className="text-xs text-destructive">This update has blockers.</p>
          </button>
        )}

        <div>
          <p className="text-xs text-muted-foreground">{updateStatusItemsText}.</p>
        </div>
      </header>

      <ol
        className="px-3.5 py-1 text-sm leading-tight [&>li+li]:mt-1 cursor-pointer hover:bg-muted rounded-sm"
        onClick={navigateOnClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigateOnClick(e);
          }
        }}
      >
        {props.statusUpdate.items.map((statusUpdateItem) => (
          <li
            key={`${statusUpdateItem.id}${statusUpdateItem.order}${statusUpdateItem.isBlocker}${statusUpdateItem.isInProgress}`}
            className="relative pl-4"
          >
            <div
              className={cn(
                "absolute left-0 top-1.5 size-2 rounded-full bg-muted-foreground/60",
                !statusUpdateItem.isInProgress && !statusUpdateItem.isBlocker && "bg-green-500",
                statusUpdateItem.isBlocker && "bg-destructive",
              )}
            />

            <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
              {statusUpdateItem.content}
            </Markdown>
          </li>
        ))}
      </ol>

      <footer className="flex items-center justify-between gap-2 mt-1.5 p-3.5">
        <Link
          to="/$organizationSlug/users/$userId"
          params={{
            organizationSlug: props.statusUpdate.organizationId,
            userId: props.statusUpdate.member.id,
          }}
          className="flex items-center gap-2"
        >
          <Avatar className="size-5">
            <AvatarImage
              src={typedUrl(getFileContract, {
                idOrSlug: props.statusUpdate.organizationId,
                // biome-ignore lint/style/noNonNullAssertion: it doesn't matter if the image is null, avatar will fallback to initials
                fileKey: props.statusUpdate.member.user.image!,
              })}
            />
            <AvatarFallback>{getInitials(props.statusUpdate.member.user.name)}</AvatarFallback>
          </Avatar>

          <p className="text-sm">
            {name} {props.statusUpdate.emoji && <span>{props.statusUpdate.emoji}</span>}
          </p>
        </Link>

        <div className="flex items-center gap-2">
          <StatusUpdateDate statusUpdate={props.statusUpdate} />
        </div>
      </footer>
    </div>
  );
}

function StatusUpdateDate(props: {
  statusUpdate: (typeof listStatusUpdatesByDateContract.$infer.output)[number];
}) {
  const session = useQuery(sessionBetterAuthQueryOptions());
  const name = useMemo(
    () => props.statusUpdate.member.user.name.split(" ")[0] ?? props.statusUpdate.member.user.name,
    [props.statusUpdate.member.user.name],
  );

  return (
    <Tooltip>
      <TooltipTrigger>
        <p className="text-xs text-muted-foreground">
          {dayjs.tz(props.statusUpdate.createdAt, session.data?.user.timezone).format("HH:mm")}
        </p>
      </TooltipTrigger>

      <TooltipContent className="p-2 border border-border rounded-lg">
        <p className="text-xs text-muted-foreground">
          Status update:{" "}
          {dayjs
            .tz(props.statusUpdate.createdAt, props.statusUpdate.timezone)
            .format("MMM D, YYYY HH:mm")}{" "}
          ({props.statusUpdate.timezone})
        </p>
        <p className="text-xs text-muted-foreground">
          {name}:{" "}
          {dayjs
            .tz(props.statusUpdate.createdAt, props.statusUpdate.member.user.timezone)
            .format("MMM D, YYYY HH:mm")}{" "}
          ({props.statusUpdate.member.user.timezone})
        </p>
        <p className="text-xs text-muted-foreground">
          You:{" "}
          {dayjs
            .tz(props.statusUpdate.createdAt, session.data?.user.timezone)
            .format("MMM D, YYYY HH:mm")}{" "}
          ({session.data?.user.timezone})
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function StatusUpdateCardSkeleton(props: { count: number }) {
  return Array.from({ length: props.count }).map((_, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: it's fine
    <div key={index} className="border border-border rounded-lg">
      <div className="p-3.5">
        <Skeleton className="h-10 w-full rounded-sm" />
      </div>

      <div className="p-3.5 py-1">
        <Skeleton className="h-6 w-1/3 rounded-sm" />
        <Skeleton className="h-12 mt-1 w-full rounded-sm" />
        <Skeleton className="h-6 mt-1 w-3/4 rounded-sm" />
        <Skeleton className="h-6 mt-1 w-1/2 rounded-sm" />
        <Skeleton className="h-6 mt-1 w-1/4 rounded-sm" />
      </div>

      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-sm" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-8 rounded-sm" />
        </div>
      </div>
    </div>
  ));
}

function getUpdateStatusItemsText(items: StatusUpdateItem[]) {
  const blockersCount = items.filter((item) => item.isBlocker).length;
  const doneCount = items.filter((item) => !item.isInProgress && !item.isBlocker).length;
  const inProgressCount = items.filter((item) => item.isInProgress).length;

  const blockersText =
    blockersCount > 0 ? `${blockersCount} blocker${blockersCount === 1 ? "" : "s"}` : undefined;
  let inProgressText = inProgressCount > 0 ? `${inProgressCount} in progress` : undefined;
  let doneText = doneCount > 0 ? `${doneCount} done` : undefined;

  if (doneText) {
    doneText = `${doneText} item${items.length === 1 ? "" : "s"}`;
  } else if (inProgressText) {
    inProgressText = `${inProgressText} item${items.length === 1 ? "" : "s"}`;
  }

  return formatter.format([blockersText, inProgressText, doneText].filter(Boolean) as string[]);
}

const remarkPlugins = [remarkGfm];

const markdownComponents = {
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm underline"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  ),
  p: ({ children }) => <span className="text-sm">{children}</span>,
  strong: ({ children }) => <strong className="text-sm">{children}</strong>,
  em: ({ children }) => <em className="text-sm">{children}</em>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-0.5 py-0.5 text-sm">{children}</code>
  ),
} satisfies Components;
