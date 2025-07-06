import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { ArrowLeftIcon } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StatusUpdateForm } from "@/components/status-update-form-v2";
import { getInitials } from "@/lib/utils";
import { getStatusUpdateQueryOptions } from "@/rpc/organization/status-update";
import { typedUrl } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/status-update/$statusUpdateId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { statusUpdateId, organizationSlug } = Route.useParams();
  const isDate = dayjs(statusUpdateId, "YYYY-MM-DD", true).isValid();
  const statusUpdate = useQuery({
    ...getStatusUpdateQueryOptions({
      idOrSlug: organizationSlug,
      statusUpdateIdOrDate: statusUpdateId,
    }),
    throwOnError: false,
  });

  if (statusUpdate.data?.isDraft || isDate) {
    return (
      <>
        <header className="flex flex-col gap-3 pb-4 sm:pb-0">
          <div className="flex items-center gap-0">
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
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {statusUpdate.data?.isDraft ? "Edit Draft" : "New Status Update"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="py-4">
          <div className="mx-auto w-full max-w-3xl">
            <StatusUpdateForm
              initialDate={statusUpdate.data?.effectiveFrom}
              organizationSlug={organizationSlug}
              initialEditorJson={statusUpdate.data?.editorJson}
              initialIsDraft={statusUpdate.data?.isDraft}
            />
          </div>
        </div>
      </>
    );
  }

  if (!statusUpdate.data && !statusUpdate.isLoading) {
    return (
      <>
        <header className="flex flex-col gap-3 pb-4 sm:pb-0">
          <div className="flex items-center gap-0">
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
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>New Status Update</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="py-4">
          <div className="mx-auto w-full max-w-3xl">
            <StatusUpdateForm initialDate={statusUpdateId} organizationSlug={organizationSlug} />
          </div>
        </div>
      </>
    );
  }

  return <ExistingStatusUpdateComponent />;
}

function ExistingStatusUpdateComponent() {
  const { statusUpdateId, organizationSlug } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);
  const { data: statusUpdate } = useQuery(
    getStatusUpdateQueryOptions({
      idOrSlug: organizationSlug,
      statusUpdateIdOrDate: statusUpdateId,
    }),
  );

  if (isEditing && statusUpdate) {
    return (
      <>
        <header className="flex flex-col gap-3 pb-4 sm:pb-0">
          <div className="flex items-center gap-0">
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
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edit Status Update</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-8 sm:size-10">
                <AvatarImage
                  src={
                    statusUpdate?.member.user.image
                      ? typedUrl(getFileContract, {
                          idOrSlug: organizationSlug,
                          fileKey: statusUpdate.member.user.image,
                        })
                      : undefined
                  }
                  alt={statusUpdate?.member.user.name}
                />
                <AvatarFallback className="text-sm">
                  {getInitials(statusUpdate?.member.user.name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-base sm:text-lg font-semibold">
                  {statusUpdate?.member.user.name}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {dayjs(statusUpdate?.effectiveFrom).format("MMM D, YYYY")}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="w-full sm:w-auto"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="sm:inline">Cancel Edit</span>
            </Button>
          </div>
        </header>

        <div className="py-4">
          <div className="mx-auto w-full max-w-3xl">
            <StatusUpdateForm
              initialDate={statusUpdate.effectiveFrom}
              organizationSlug={organizationSlug}
              initialEditorJson={statusUpdate.editorJson}
              initialIsDraft={statusUpdate.isDraft}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-3 pb-4 sm:pb-0">
        <div className="flex items-center gap-0">
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
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{statusUpdate?.member.user.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 sm:size-12">
              <AvatarImage
                src={
                  statusUpdate?.member.user.image
                    ? typedUrl(getFileContract, {
                        idOrSlug: organizationSlug,
                        fileKey: statusUpdate.member.user.image,
                      })
                    : undefined
                }
                alt={statusUpdate?.member.user.name}
              />
              <AvatarFallback className="text-sm sm:text-lg">
                {getInitials(statusUpdate?.member.user.name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">{statusUpdate?.member.user.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Status for {dayjs(statusUpdate?.effectiveFrom).format("MMM D, YYYY")}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto"
          >
            Edit
          </Button>
        </div>
      </header>

      <div className="py-4">
        <div className="prose prose-neutral dark:prose-invert prose-sm mx-auto w-full max-w-3xl px-3 sm:px-4">
          <section className="mt-6">
            <h2 className="text-base sm:text-lg font-semibold mb-4">
              What&apos;s new for {dayjs(statusUpdate?.effectiveFrom).format("MMM D, YYYY")}
            </h2>

            <ul className="space-y-3 pl-0">
              {statusUpdate?.items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border",
                    item.isBlocker && "border-destructive bg-destructive/5",
                    !item.isInProgress &&
                      !item.isBlocker &&
                      "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
                    item.isInProgress &&
                      !item.isBlocker &&
                      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                  )}
                  style={{ listStyle: "none" }}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      item.isBlocker && "bg-destructive",
                      !item.isInProgress && !item.isBlocker && "bg-green-500",
                      item.isInProgress && !item.isBlocker && "bg-amber-500",
                    )}
                  />
                  <div className="flex-1 min-w-0 text-sm sm:text-base">
                    <Markdown remarkPlugins={[remarkGfm]}>{item.content}</Markdown>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {statusUpdate?.notes && (
            <section className="mt-8">
              <h2 className="text-base sm:text-lg font-semibold mb-4">Notes</h2>
              <div className="prose-sm sm:prose-base">
                <Markdown remarkPlugins={[remarkGfm]}>{statusUpdate?.notes}</Markdown>
              </div>
            </section>
          )}

          {statusUpdate?.mood && (
            <section className="mt-8">
              <h2 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                Mood {statusUpdate?.emoji && <span className="text-xl">{statusUpdate.emoji}</span>}
              </h2>
              <div className="prose-sm sm:prose-base">
                <Markdown remarkPlugins={[remarkGfm]}>{statusUpdate?.mood}</Markdown>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
