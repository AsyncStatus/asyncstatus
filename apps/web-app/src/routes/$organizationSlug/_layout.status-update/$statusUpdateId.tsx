import { useState } from "react";
import { getStatusUpdateQueryOptions } from "@/rpc/organization/status-update";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import { Button } from "@asyncstatus/ui/components/button";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getFileUrl, getInitials } from "@/lib/utils";
import { StatusUpdateForm } from "@/components/status-update-form-v2";

export const Route = createFileRoute(
  "/$organizationSlug/_layout/status-update/$statusUpdateId",
)({
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
      <div className="mx-auto w-full max-w-3xl">
        <StatusUpdateForm
          initialDate={statusUpdate.data?.effectiveFrom}
          organizationSlug={organizationSlug}
          initialEditorJson={statusUpdate.data?.editorJson}
          initialIsDraft={statusUpdate.data?.isDraft}
        />
      </div>
    );
  }

  if (!statusUpdate.data && !statusUpdate.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <StatusUpdateForm
          initialDate={statusUpdateId}
          organizationSlug={organizationSlug}
        />
      </div>
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
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
        <StatusUpdateForm
          initialDate={statusUpdate.effectiveFrom}
          organizationSlug={organizationSlug}
          initialEditorJson={statusUpdate.editorJson}
          initialIsDraft={statusUpdate.isDraft}
        />
      </div>
    );
  }

  return (
    <div className="prose prose-neutral dark:prose-invert prose-sm h-full w-full max-w-3xl px-4 py-2.5">
      <header className="flex items-center gap-4">
        <div className="not-prose flex items-center">
          <Avatar>
            <AvatarImage
              src={
                statusUpdate?.member.user.image
                  ? getFileUrl({
                      param: { idOrSlug: organizationSlug },
                      query: { fileKey: statusUpdate.member.user.image },
                    })
                  : undefined
              }
              alt={statusUpdate?.member.user.name}
            />
            <AvatarFallback>
              {getInitials(statusUpdate?.member.user.name ?? "")}
            </AvatarFallback>
          </Avatar>
        </div>

        <h1 className="font-title m-0! p-0! text-2xl font-bold">
          {statusUpdate?.member.user.name}
        </h1>
      </header>

      <section className="mt-8">
        <h2>
          What&apos;s new for{" "}
          {dayjs(statusUpdate?.effectiveFrom).format("MMM D, YYYY")}
        </h2>

        <ul className="pl-3!">
          {statusUpdate?.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                item.isBlocker && "marker:text-destructive",
                !item.isInProgress &&
                  !item.isBlocker &&
                  "marker:text-green-500",
              )}
            >
              <Markdown remarkPlugins={[remarkGfm]}>{item.content}</Markdown>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Notes</h2>
        <Markdown remarkPlugins={[remarkGfm]}>{statusUpdate?.notes}</Markdown>
      </section>

      <section>
        <h2>Mood {statusUpdate?.emoji}</h2>
        <Markdown remarkPlugins={[remarkGfm]}>{statusUpdate?.mood}</Markdown>
      </section>

      <div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </div>
    </div>
  );
}
