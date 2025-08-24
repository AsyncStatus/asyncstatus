import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
  shareStatusUpdateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Separator } from "@asyncstatus/ui/components/separator";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@asyncstatus/ui/components/tooltip";
import { AlertTriangle, ShareIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { useCopyToClipboard } from "@/lib/use-copy-to-clipboard";
import { getInitials } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";

export type StatusUpdateCardProps = {
  organizationSlug: string;
  statusUpdate: (typeof listStatusUpdatesByDateContract.$infer.output)[number];
};

const formatter = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

export function StatusUpdateCard(props: StatusUpdateCardProps) {
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
    <div className="flex flex-col border border-border rounded-lg">
      <header className="p-3.5">
        <div className="flex items-center justify-between gap-0.5">
          {hasAnyBlockers && (
            <Link
              className="w-full"
              to="/$organizationSlug/status-updates/$statusUpdateId"
              params={{
                organizationSlug: props.organizationSlug,
                statusUpdateId: props.statusUpdate.id,
              }}
            >
              <button
                type="button"
                className="flex items-center gap-2 bg-destructive/10 hover:bg-destructive/20 p-1 rounded-sm w-full cursor-pointer"
              >
                <AlertTriangle className="size-3 text-destructive" />
                <p className="text-xs text-destructive">This update has blockers</p>
              </button>
            </Link>
          )}

          {!hasAnyBlockers && (
            <p className="text-xs text-muted-foreground w-full">{updateStatusItemsText}</p>
          )}

          <StatusUpdateShareButton
            organizationSlug={props.organizationSlug}
            statusUpdate={props.statusUpdate}
          />
        </div>

        {hasAnyBlockers && (
          <div className="mt-1">
            <p className="text-xs text-muted-foreground w-full">{updateStatusItemsText}</p>
          </div>
        )}
      </header>

      <Link
        to="/$organizationSlug/status-updates/$statusUpdateId"
        params={{
          organizationSlug: props.organizationSlug,
          statusUpdateId: props.statusUpdate.id,
        }}
        className="flex-1"
      >
        <ol className="px-3.5 py-1 h-full text-sm leading-tight [&>li+li]:mt-1 cursor-pointer hover:bg-muted rounded-sm">
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
      </Link>

      <footer className="flex items-center justify-between gap-2 mt-1.5 p-3.5">
        <div className="flex items-center gap-2">
          <Link
            to="/$organizationSlug/users/$userId"
            params={{
              organizationSlug: props.organizationSlug,
              userId: props.statusUpdate.member.id,
            }}
            className="flex items-center gap-2"
          >
            <Avatar className="size-5">
              <AvatarImage
                src={typedUrl(getFileContract, {
                  idOrSlug: props.organizationSlug,
                  // biome-ignore lint/style/noNonNullAssertion: it doesn't matter if the image is null, avatar will fallback to initials
                  fileKey: props.statusUpdate.member.user.image!,
                })}
              />
              <AvatarFallback className="text-[0.6rem]">
                {getInitials(props.statusUpdate.member.user.name)}
              </AvatarFallback>
            </Avatar>

            <p className="text-sm">
              {name} {props.statusUpdate.emoji && <span>{props.statusUpdate.emoji}</span>}
            </p>
          </Link>

          <Link
            to="/$organizationSlug/teams/$teamId"
            params={{
              organizationSlug: props.organizationSlug,
              teamId: props.statusUpdate.team?.id ?? "",
            }}
          >
            <p className="text-[0.65rem] text-muted-foreground">{props.statusUpdate.team?.name}</p>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <StatusUpdateDate statusUpdate={props.statusUpdate} />
        </div>
      </footer>
    </div>
  );
}

function StatusUpdateShareButton(props: {
  organizationSlug: string;
  statusUpdate: (typeof listStatusUpdatesByDateContract.$infer.output)[number];
}) {
  const queryClient = useQueryClient();
  const shareStatusUpdateMutation = useMutation(
    typedMutationOptions(shareStatusUpdateContract, {
      onSuccess: (data) => {
        queryClient.setQueryData(
          typedQueryOptions(listStatusUpdatesByDateContract, {
            idOrSlug: props.organizationSlug,
            date: dayjs(props.statusUpdate.createdAt).format("YYYY-MM-DD"),
          }).queryKey,
          (old) => {
            if (!old) {
              return old;
            }

            return old.map((statusUpdate: any) =>
              statusUpdate.id === props.statusUpdate.id
                ? { ...statusUpdate, slug: data.slug }
                : statusUpdate,
            );
          },
        );
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: props.organizationSlug,
            statusUpdateIdOrDate: props.statusUpdate.id,
          }).queryKey,
          (old) => {
            if (!old) {
              return old;
            }

            return { ...old, slug: data.slug };
          },
        );
      },
    }),
  );

  const [copiedLink, copyLinkToClipboard] = useCopyToClipboard();

  return (
    <button
      type="button"
      className="flex items-center gap-2 bg-background hover:bg-muted p-1 rounded-sm cursor-pointer"
      onClick={() => {
        if (!props.statusUpdate.slug) {
          shareStatusUpdateMutation
            .mutateAsync({
              idOrSlug: props.organizationSlug,
              statusUpdateId: props.statusUpdate.id,
            })
            .then((data) => {
              copyLinkToClipboard(`${import.meta.env.VITE_MARKETING_APP_URL}/s/${data.slug}`).then(
                () => {
                  toast.success("Status update link copied to clipboard", {
                    position: "top-center",
                  });
                },
              );
            });
        } else {
          copyLinkToClipboard(
            `${import.meta.env.VITE_MARKETING_APP_URL}/s/${props.statusUpdate.slug}`,
          ).then(() => {
            toast.success("Status update link copied to clipboard", {
              position: "top-center",
            });
          });
        }
      }}
    >
      <ShareIcon className="size-3" />
      <p className="text-xs">Share</p>
    </button>
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
  const lessThanTenMinutesDifference = useMemo(
    () =>
      props.statusUpdate.updatedAt
        ? dayjs(props.statusUpdate.updatedAt).diff(dayjs(props.statusUpdate.createdAt), "minute") <
          10
        : false,
    [props.statusUpdate.updatedAt, props.statusUpdate.createdAt],
  );
  const edited = useMemo(() => {
    if (!props.statusUpdate.updatedAt) {
      return false;
    }

    if (lessThanTenMinutesDifference) {
      return false;
    }

    // Compare timestamps to determine if edited
    const createdTime = dayjs(props.statusUpdate.createdAt).valueOf();
    const updatedTime = dayjs(props.statusUpdate.updatedAt).valueOf();

    return updatedTime !== createdTime;
  }, [lessThanTenMinutesDifference, props.statusUpdate.updatedAt, props.statusUpdate.createdAt]);

  return (
    <Tooltip>
      <TooltipTrigger>
        <p className={cn("text-xs text-muted-foreground", edited && "italic")}>
          {dayjs
            .utc(edited ? props.statusUpdate.updatedAt : props.statusUpdate.createdAt)
            .tz(session.data?.user.timezone)
            .format("HH:mm")}
          {edited ? " edited" : ""}
        </p>
      </TooltipTrigger>

      <TooltipContent className="p-2 border border-border rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Created:</span>{" "}
          {dayjs
            .utc(props.statusUpdate.createdAt)
            .tz(props.statusUpdate.timezone)
            .format("MMM D, YYYY HH:mm:ss")}{" "}
          ({props.statusUpdate.timezone})
        </p>
        {props.statusUpdate.updatedAt && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Edited:</span>{" "}
            {dayjs
              .utc(props.statusUpdate.updatedAt)
              .tz(props.statusUpdate.timezone)
              .format("MMM D, YYYY HH:mm:ss")}{" "}
            ({props.statusUpdate.timezone})
          </p>
        )}
        <Separator className="my-1.5" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{name}:</span>{" "}
          {dayjs
            .utc(props.statusUpdate.createdAt)
            .tz(props.statusUpdate.member.user.timezone)
            .format("MMM D, YYYY HH:mm:ss")}{" "}
          ({props.statusUpdate.member.user.timezone})
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">You:</span>{" "}
          {dayjs
            .utc(props.statusUpdate.createdAt)
            .tz(session.data?.user.timezone)
            .format("MMM D, YYYY HH:mm:ss")}{" "}
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

function getUpdateStatusItemsText(
  items: (typeof listStatusUpdatesByDateContract.$infer.output)[number]["items"],
) {
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
      className="text-sm underline break-all"
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
