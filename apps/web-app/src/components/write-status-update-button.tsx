import {
  createStatusUpdateContract,
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
} from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
import { Button } from "@asyncstatus/ui/components/button";
import { ArrowRightIcon, Pencil, Plus } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export type WriteStatusUpdateButtonProps = {
  organizationSlug: string;
  date: string;
  className?: string;
};

export function WriteStatusUpdateButton({
  organizationSlug,
  date,
  className,
}: WriteStatusUpdateButtonProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const statusUpdate = useQuery(
    typedQueryOptions(
      getMemberStatusUpdateContract,
      { idOrSlug: organizationSlug, statusUpdateIdOrDate: date },
      { throwOnError: false },
    ),
  );
  const createStatusUpdate = useMutation(
    typedMutationOptions(createStatusUpdateContract, {
      onSuccess: (data) => {
        const date = dayjs(data.effectiveFrom).format("YYYY-MM-DD");
        queryClient.invalidateQueries(
          typedQueryOptions(listStatusUpdatesByDateContract, {
            idOrSlug: organizationSlug,
            date,
          }),
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }),
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }),
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: date,
          }),
        );
        navigate({
          to: "/$organizationSlug/status-updates/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
          replace: true,
        });
      },
    }),
  );

  function createEmptyStatusUpdate() {
    createStatusUpdate.mutate({
      idOrSlug: organizationSlug,
      effectiveFrom: dayjs.utc(date, "YYYY-MM-DD").startOf("day").toISOString(),
      effectiveTo: dayjs.utc(date, "YYYY-MM-DD").endOf("day").toISOString(),
      isDraft: true,
    });
  }

  if (!statusUpdate.data) {
    return (
      <Button size="sm" variant="outline" onClick={createEmptyStatusUpdate} className={className}>
        <Plus className="size-4" />
        <span>Write update</span>
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" asChild className={className}>
      <Link
        to="/$organizationSlug/status-updates/$statusUpdateId"
        params={{ organizationSlug, statusUpdateId: statusUpdate.data.id }}
      >
        {statusUpdate.data.isDraft ? (
          <Pencil className="size-4" />
        ) : (
          <ArrowRightIcon className="size-4" />
        )}
        <span>{statusUpdate.data.isDraft ? "Continue writing" : "Edit update"}</span>
      </Link>
    </Button>
  );
}
