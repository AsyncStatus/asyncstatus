import { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import {
  deleteScheduleDeliveryTargetContract,
  getScheduleDeliveryTargetContract,
} from "@asyncstatus/api/typed-handlers/schedule-delivery-target";
import { Button } from "@asyncstatus/ui/components/button";
import { PlusIcon, X } from "@asyncstatus/ui/icons";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { UpsertScheduleDeliveryTargetForm } from "./upsert-schedule-delivery-target-form";

export type DeliverToFormProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function DeliverToForm(props: DeliverToFormProps) {
  const [addNewDeliveryTarget, setAddNewDeliveryTarget] = useState(false);
  const queryClient = useQueryClient();
  const schedule = useQuery(
    typedQueryOptions(
      getScheduleContract,
      { idOrSlug: props.organizationSlug, scheduleId: props.scheduleId },
      { initialData: keepPreviousData },
    ),
  );
  const scheduleHasTeamOrMemberOrSlackChannelTargets = useMemo(() => {
    return schedule.data?.deliveryTargets.some(
      (target) =>
        target.targetType === "team" ||
        target.targetType === "member" ||
        target.targetType === "slack_channel",
    );
  }, [schedule.data?.deliveryTargets]);

  const deleteDeliveryTarget = useMutation(
    typedMutationOptions(deleteScheduleDeliveryTargetContract, {
      onSuccess: (data, variables) => {
        // @TODO: fix types for typed-handlers that are not using form data
        if (variables instanceof FormData) {
          return;
        }

        queryClient.setQueryData(
          typedQueryOptions(getScheduleContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
          }).queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              deliveryTargets: oldData.deliveryTargets.filter(
                (target) => target.id !== variables.targetId,
              ),
            };
          },
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getScheduleDeliveryTargetContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
            targetId: variables.targetId,
          }),
        );
      },
    }),
  );

  return (
    <div className="flex items-start flex-col gap-4">
      <div className="flex items-center flex-wrap">
        {schedule.data?.deliveryTargets.length === 0 && (
          <UpsertScheduleDeliveryTargetForm
            organizationSlug={props.organizationSlug}
            scheduleId={props.scheduleId}
          />
        )}

        {schedule.data?.deliveryTargets.map((target) => (
          <Fragment key={target.id}>
            <UpsertScheduleDeliveryTargetForm
              organizationSlug={props.organizationSlug}
              scheduleId={props.scheduleId}
              targetId={target.id}
            />
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() =>
                deleteDeliveryTarget.mutate({
                  idOrSlug: props.organizationSlug,
                  scheduleId: props.scheduleId,
                  targetId: target.id,
                })
              }
            >
              <X className="w-4 h-4" />
            </Button>
          </Fragment>
        ))}

        {addNewDeliveryTarget && (
          <>
            <UpsertScheduleDeliveryTargetForm
              organizationSlug={props.organizationSlug}
              scheduleId={props.scheduleId}
            />
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setAddNewDeliveryTarget(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {scheduleHasTeamOrMemberOrSlackChannelTargets && !addNewDeliveryTarget && (
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => setAddNewDeliveryTarget(true)}
        >
          <PlusIcon className="size-4" />
          Add user or team
        </Button>
      )}
    </div>
  );
}
