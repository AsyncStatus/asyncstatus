import { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import {
  deleteScheduleDeliveryContract,
  getScheduleDeliveryContract,
} from "@asyncstatus/api/typed-handlers/schedule-delivery";
import { Button } from "@asyncstatus/ui/components/button";
import { PlusIcon, X } from "@asyncstatus/ui/icons";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { UpsertScheduleDeliveryForm } from "./upsert-schedule-delivery-form";

export type DeliveryMethodFormProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function DeliveryMethodForm(props: DeliveryMethodFormProps) {
  const [addNewDelivery, setAddNewDelivery] = useState(false);
  const queryClient = useQueryClient();
  const schedule = useQuery(
    typedQueryOptions(
      getScheduleContract,
      { idOrSlug: props.organizationSlug, scheduleId: props.scheduleId },
      { initialData: keepPreviousData },
    ),
  );
  const hasAnyDeliveries = useMemo(() => {
    return schedule.data?.deliveries.length > 0;
  }, [schedule.data?.deliveries.length]);
  const hasSelectedEveryDeliveryMethod = useMemo(() => {
    return schedule.data?.deliveries.length >= 2;
  }, [schedule.data?.deliveries.length]);

  const deleteDelivery = useMutation(
    typedMutationOptions(deleteScheduleDeliveryContract, {
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
              deliveries: oldData.deliveries.filter(
                (delivery) => delivery.id !== variables.deliveryId,
              ),
            };
          },
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getScheduleDeliveryContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
            deliveryId: variables.deliveryId,
          }),
        );
      },
    }),
  );

  return (
    <div className="flex items-start flex-col gap-4">
      <div className="flex items-center flex-wrap gap-2">
        {schedule.data?.deliveries.length === 0 && (
          <UpsertScheduleDeliveryForm
            organizationSlug={props.organizationSlug}
            scheduleId={props.scheduleId}
          />
        )}

        {schedule.data?.deliveries.map((delivery) => (
          <Fragment key={delivery.id}>
            <UpsertScheduleDeliveryForm
              organizationSlug={props.organizationSlug}
              scheduleId={props.scheduleId}
              deliveryId={delivery.id}
            />
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() =>
                deleteDelivery.mutate({
                  idOrSlug: props.organizationSlug,
                  scheduleId: props.scheduleId,
                  deliveryId: delivery.id,
                })
              }
            >
              <X className="w-4 h-4" />
            </Button>
          </Fragment>
        ))}

        {addNewDelivery && (
          <>
            <UpsertScheduleDeliveryForm
              organizationSlug={props.organizationSlug}
              scheduleId={props.scheduleId}
            />
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setAddNewDelivery(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {!hasSelectedEveryDeliveryMethod && hasAnyDeliveries && !addNewDelivery && (
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => setAddNewDelivery(true)}
        >
          <PlusIcon className="size-4" />
          Add delivery
        </Button>
      )}
    </div>
  );
}
