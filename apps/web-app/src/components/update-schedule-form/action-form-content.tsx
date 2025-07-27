import {
  getScheduleContract,
  type updateScheduleContract,
} from "@asyncstatus/api/typed-handlers/schedule";
import {
  deleteScheduleTargetContract,
  getScheduleTargetContract,
} from "@asyncstatus/api/typed-handlers/schedule-target";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { PlusIcon, X } from "@asyncstatus/ui/icons";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { FormField } from "../form";
import { UpsertScheduleTargetForm } from "./upsert-schedule-target-form";

export type ActionFormContentProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function ActionFormContent(props: ActionFormContentProps) {
  const [addNewTarget, setAddNewTarget] = useState(false);
  const queryClient = useQueryClient();
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();
  const schedule = useQuery(
    typedQueryOptions(
      getScheduleContract,
      { idOrSlug: props.organizationSlug, scheduleId: props.scheduleId },
      { initialData: keepPreviousData },
    ),
  );
  const scheduleHasTeamOrMemberTargets = useMemo(() => {
    return schedule.data?.targets.some(
      (target) => target.targetType === "team" || target.targetType === "member",
    );
  }, [schedule.data?.targets]);

  const deleteTarget = useMutation(
    typedMutationOptions(deleteScheduleTargetContract, {
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
              targets: oldData.targets.filter((target) => target.id !== variables.targetId),
            };
          },
        );
        queryClient.invalidateQueries(
          typedQueryOptions(getScheduleTargetContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
            targetId: variables.targetId,
          }),
        );
      },
    }),
  );

  const actionType = form.watch("actionType");

  return (
    <div className="flex items-start flex-col gap-4">
      <div className="flex items-center gap-2">
        <FormField
          control={form.control}
          name="actionType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger ref={field.ref} onBlur={field.onBlur} disabled={field.disabled}>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generateUpdates">Generate updates</SelectItem>
                <SelectItem value="pingForUpdates">Ping for updates</SelectItem>
                <SelectItem value="sendSummaries">Send summaries</SelectItem>
              </SelectContent>
            </Select>
          )}
        />

        <div className="flex items-center">
          <div className="flex items-center flex-wrap gap-2">
            {(actionType === "generateUpdates" || actionType === "sendSummaries") && (
              <p className="text-sm font-medium text-muted-foreground">for</p>
            )}

            <div className="flex items-center flex-wrap">
              {schedule.data?.targets.length === 0 && (
                <UpsertScheduleTargetForm
                  organizationSlug={props.organizationSlug}
                  scheduleId={props.scheduleId}
                />
              )}

              {schedule.data?.targets.map((target) => (
                <Fragment key={target.id}>
                  <UpsertScheduleTargetForm
                    organizationSlug={props.organizationSlug}
                    scheduleId={props.scheduleId}
                    targetId={target.id}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() =>
                      deleteTarget.mutate({
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

              {addNewTarget && (
                <>
                  <UpsertScheduleTargetForm
                    organizationSlug={props.organizationSlug}
                    scheduleId={props.scheduleId}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => setAddNewTarget(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {scheduleHasTeamOrMemberTargets && !addNewTarget && (
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => setAddNewTarget(true)}
        >
          <PlusIcon className="size-4" />
          Add user or team
        </Button>
      )}
    </div>
  );
}
