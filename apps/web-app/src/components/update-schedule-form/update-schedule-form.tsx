import {
  getScheduleContract,
  listSchedulesContract,
  updateScheduleContract,
} from "@asyncstatus/api/typed-handlers/schedule";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import useDebouncedCallback from "@/lib/use-debounced-callback";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { Form } from "../form";
import { ActionFormContent } from "./action-form-content";
import { DeliveryFormContent } from "./delivery-form-content";
import { WhenFormContent } from "./when-form-content";

export type UpdateScheduleFormProps = {
  organizationSlug: string;
  scheduleId: string;
  onSuccess?: (data: typeof updateScheduleContract.$infer.output) => void;
};

function UpdateScheduleFormUnmemoized(props: UpdateScheduleFormProps) {
  const queryClient = useQueryClient();
  const session = useQuery(sessionBetterAuthQueryOptions());
  const schedule = useQuery(
    typedQueryOptions(
      getScheduleContract,
      { idOrSlug: props.organizationSlug, scheduleId: props.scheduleId },
      { initialData: keepPreviousData },
    ),
  );
  const form = useForm({
    resolver: zodResolver(updateScheduleContract.inputSchema),
    mode: "onChange",
    defaultValues: {
      idOrSlug: props.organizationSlug,
      scheduleId: props.scheduleId,
      name: schedule.data?.name ?? "generateUpdates",
      config: schedule.data?.config ?? {
        name: "generateUpdates",
        timeOfDay: "09:30",
        timezone: "UTC",
        generateFor: [
          {
            type: "organization",
            value: props.organizationSlug,
            usingActivityFrom: [{ type: "anyIntegration", value: "anyIntegration" }],
          },
        ],
      },
      isActive: schedule.data?.isActive ?? false,
    },
  });

  const updateSchedule = useMutation(
    typedMutationOptions(updateScheduleContract, {
      onSuccess: (data) => {
        props.onSuccess?.(data);
        queryClient.setQueryData(
          typedQueryOptions(listSchedulesContract, { idOrSlug: props.organizationSlug }).queryKey,
          (old) => {
            if (!old) return old;
            return old.map((schedule) => (schedule.id === props.scheduleId ? data : schedule));
          },
        );
        queryClient.setQueryData(
          typedQueryOptions(getScheduleContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
          }).queryKey,
          data,
        );
      },
    }),
  );

  useEffect(() => {
    if (session.data?.user.timezone) {
      form.setValue("config.timezone", session.data.user.timezone);
    }
  }, [session.data?.user.timezone]);

  useEffect(() => {
    if (schedule.data) {
      form.reset({
        idOrSlug: props.organizationSlug,
        scheduleId: props.scheduleId,
        name: schedule.data.name,
        config: schedule.data.config,
        isActive: schedule.data.isActive,
      });
    }
  }, [schedule.data, props.organizationSlug, props.scheduleId]);

  const onSubmit = useCallback(
    (data: typeof updateScheduleContract.$infer.input) => {
      if (updateSchedule.isPending || !form.formState.isValid || !form.formState.isDirty) {
        return;
      }
      updateSchedule.mutate(data);
    },
    [updateSchedule.isPending, form.formState.isValid, form.formState.isDirty],
  );

  const debouncedSave = useDebouncedCallback(onSubmit, 1000);
  const formValues = form.watch();
  useEffect(() => {
    if (updateSchedule.isPending || !form.formState.isValid || !form.formState.isDirty) {
      return;
    }
    debouncedSave(formValues);
  }, [
    debouncedSave,
    formValues,
    updateSchedule.isPending,
    form.formState.isValid,
    form.formState.isDirty,
  ]);

  const configName = form.watch("config.name");

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-2 border border-border rounded-md p-4">
            <p className="text-base font-medium">Action</p>
            <div className="flex items-center flex-wrap gap-2">
              <ActionFormContent
                organizationSlug={props.organizationSlug}
                scheduleId={props.scheduleId}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 border border-border rounded-md p-4">
            <p className="text-base font-medium">When</p>
            <div className="flex items-center flex-wrap gap-2">
              <WhenFormContent />
            </div>
          </div>

          {configName !== "generateUpdates" && (
            <div className="flex flex-col gap-2 border border-border rounded-md p-4">
              <p className="text-base font-medium">Delivery</p>
              <div className="flex items-center flex-wrap gap-2">
                <DeliveryFormContent
                  organizationSlug={props.organizationSlug}
                  scheduleId={props.scheduleId}
                />
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}

export const UpdateScheduleForm = memo(UpdateScheduleFormUnmemoized, (prevProps, nextProps) => {
  return (
    prevProps.organizationSlug === nextProps.organizationSlug &&
    prevProps.scheduleId === nextProps.scheduleId &&
    prevProps.onSuccess === nextProps.onSuccess
  );
});
