import type {
  getScheduleContract,
  ScheduleConfigGenerateUpdates,
  ScheduleConfigRemindToPostUpdates,
  ScheduleConfigSendSummaries,
  updateScheduleContract,
} from "@asyncstatus/api/typed-handlers/schedule";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { PlusIcon } from "@asyncstatus/ui/icons";
import { useFormContext } from "react-hook-form";
import { FormField } from "../form";
import { GenerateForSelect } from "./generate-for-select";
import { GenerateForUsingActivityFromSelect } from "./generate-for-using-activity-from";
import { SummaryForSelect } from "./summary-for-select";

export type ActionFormContentProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function ActionFormContent(props: ActionFormContentProps) {
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();
  const configName = form.watch("config.name");
  const generateFor = form.watch("config.generateFor");
  const isAddingGenerateFor = generateFor?.findIndex((field) => field === undefined) !== -1;

  return (
    <div className="flex items-start flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                const previousConfig = form.getValues("config");
                form.setValue(
                  "config",
                  getDefaultConfigBasedOnName(
                    props.organizationSlug,
                    value as (typeof getScheduleContract.$infer.output)["name"],
                    previousConfig as any,
                  ),
                );
              }}
            >
              <SelectTrigger ref={field.ref} onBlur={field.onBlur} disabled={field.disabled}>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remindToPostUpdates">Remind to post updates</SelectItem>
                <SelectItem value="generateUpdates">Generate updates</SelectItem>
                <SelectItem value="sendSummaries">Send summaries</SelectItem>
              </SelectContent>
            </Select>
          )}
        />

        <p className="text-sm text-muted-foreground">
          {configName === "generateUpdates" && "for"}
          {configName === "sendSummaries" && "based on"}
        </p>

        {configName === "generateUpdates" && generateFor?.length === 0 && (
          <FormField
            control={form.control}
            name="config.generateFor"
            render={({ field }) => (
              <GenerateForSelect
                size="default"
                allowEveryone
                type={undefined}
                placeholder="Select who to generate updates for"
                organizationSlug={props.organizationSlug}
                value={undefined}
                onSelect={(type, value) => {
                  if (type === undefined) {
                    field.onChange([]);
                    return;
                  }

                  field.onChange([{ type, value }]);
                }}
              />
            )}
          />
        )}

        {configName === "generateUpdates" &&
          generateFor?.map((field, index) => (
            <FormField
              key={`${field?.type}-${field?.value}`}
              control={form.control}
              name="config.generateFor"
              render={({ field }) => (
                <>
                  <p className="text-sm text-muted-foreground">and</p>

                  <GenerateForSelect
                    size="default"
                    allowEveryone
                    placeholder="Select user or team"
                    organizationSlug={props.organizationSlug}
                    type={field.value?.[index]?.type}
                    value={field.value?.[index]?.value}
                    onSelect={(type, value) => {
                      if (type === undefined) {
                        field.onChange(generateFor?.filter((_, i) => i !== index) ?? []);
                        return;
                      }

                      if (type === "organization" && value === props.organizationSlug) {
                        field.onChange([{ type, value }]);
                        return;
                      }

                      field.onChange(
                        generateFor?.map((field, i) =>
                          i === index
                            ? {
                                type,
                                value,
                                usingActivityFrom: field?.usingActivityFrom ?? [
                                  { type: "anyIntegration", value: "anyIntegration" },
                                ],
                              }
                            : field,
                        ) ?? [],
                      );
                    }}
                  />

                  <p className="text-sm text-muted-foreground">using</p>

                  <GenerateForUsingActivityFromSelect
                    size="default"
                    organizationSlug={props.organizationSlug}
                    values={field.value?.[index]?.usingActivityFrom ?? []}
                    onSelect={(usingActivityFrom) => {
                      field.onChange(
                        generateFor?.map((field, i) =>
                          i === index ? { ...field, usingActivityFrom } : field,
                        ) ?? [],
                      );
                    }}
                  />
                </>
              )}
            />
          ))}

        {configName === "sendSummaries" && (
          <FormField
            control={form.control}
            name="config.summaryFor"
            render={({ field }) => (
              <SummaryForSelect
                size="default"
                organizationSlug={props.organizationSlug}
                values={(field.value as any) ?? []}
                onSelect={(value) => {
                  field.onChange(value);
                }}
              />
            )}
          />
        )}
      </div>

      {!isAddingGenerateFor && (
        <FormField
          control={form.control}
          name="config.generateFor"
          render={({ field }) => (
            <Button
              size="sm"
              variant="outline"
              className="text-muted-foreground"
              onClick={() => {
                field.onChange([...(field.value ?? []), { type: undefined, value: undefined }]);
              }}
            >
              <PlusIcon className="size-4" />
              Add user or team
            </Button>
          )}
        />
      )}
    </div>
  );
}

function getDefaultConfigBasedOnName(
  organizationSlug: string,
  name: (typeof getScheduleContract.$infer.output)["name"],
  previousConfig?: (typeof getScheduleContract.$infer.output)["config"],
) {
  switch (name) {
    case "remindToPostUpdates":
      return {
        name: "remindToPostUpdates",
        timeOfDay: previousConfig?.timeOfDay ?? "10:00",
        timezone: previousConfig?.timezone ?? "UTC",
        recurrence: previousConfig?.recurrence ?? "daily",
        dayOfWeek: previousConfig?.dayOfWeek ?? undefined,
        dayOfMonth: previousConfig?.dayOfMonth ?? undefined,
        deliveryMethods:
          previousConfig?.name === "remindToPostUpdates" || previousConfig?.name === "sendSummaries"
            ? previousConfig?.deliveryMethods
            : [{ type: "organization", value: organizationSlug }],
      } satisfies ScheduleConfigRemindToPostUpdates;
    case "generateUpdates":
      return {
        name: "generateUpdates",
        timeOfDay: previousConfig?.timeOfDay ?? "00:00",
        timezone: previousConfig?.timezone ?? "UTC",
        recurrence: previousConfig?.recurrence ?? "daily",
        dayOfWeek: previousConfig?.dayOfWeek ?? undefined,
        dayOfMonth: previousConfig?.dayOfMonth ?? undefined,
        generateFor:
          previousConfig?.name === "generateUpdates"
            ? previousConfig?.generateFor
            : [
                {
                  type: "organization",
                  value: organizationSlug,
                  usingActivityFrom: [{ type: "anyIntegration", value: "anyIntegration" }],
                },
              ],
      } satisfies ScheduleConfigGenerateUpdates;
    case "sendSummaries":
      return {
        name: "sendSummaries",
        timeOfDay: previousConfig?.timeOfDay ?? "11:00",
        timezone: previousConfig?.timezone ?? "UTC",
        recurrence: previousConfig?.recurrence ?? "daily",
        dayOfWeek: previousConfig?.dayOfWeek ?? undefined,
        dayOfMonth: previousConfig?.dayOfMonth ?? undefined,
        summaryFor:
          previousConfig?.name === "sendSummaries"
            ? previousConfig?.summaryFor
            : [{ type: "organization", value: organizationSlug }],
        deliveryMethods:
          previousConfig?.name === "remindToPostUpdates" || previousConfig?.name === "sendSummaries"
            ? previousConfig?.deliveryMethods
            : [{ type: "organization", value: organizationSlug }],
      } satisfies ScheduleConfigSendSummaries;
  }
}
