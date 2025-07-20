import {
  getMemberStatusUpdateContract,
  getStatusUpdateContract,
  listStatusUpdatesByDateContract,
  upsertStatusUpdateContract,
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
    typedMutationOptions(upsertStatusUpdateContract, {
      onSuccess: (data) => {
        navigate({
          to: "/$organizationSlug/status-updates/$statusUpdateId",
          params: { organizationSlug, statusUpdateId: data.id },
        });
        if (!data.isDraft) {
          queryClient.invalidateQueries(
            typedQueryOptions(listStatusUpdatesByDateContract, {
              idOrSlug: organizationSlug,
              date: dayjs(data.effectiveFrom).format("YYYY-MM-DD"),
            }),
          );
        }
        queryClient.setQueryData(
          typedQueryOptions(getStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: data.id,
          }).queryKey,
          data,
        );
        queryClient.setQueryData(
          typedQueryOptions(getMemberStatusUpdateContract, {
            idOrSlug: organizationSlug,
            statusUpdateIdOrDate: dayjs(data.effectiveFrom).format("YYYY-MM-DD"),
          }).queryKey,
          data,
        );
      },
    }),
  );

  function createEmptyStatusUpdate() {
    createStatusUpdate.mutate({
      idOrSlug: organizationSlug,
      effectiveFrom: dayjs(date, "YYYY-MM-DD").toDate(),
      effectiveTo: dayjs(date, "YYYY-MM-DD").toDate(),
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
