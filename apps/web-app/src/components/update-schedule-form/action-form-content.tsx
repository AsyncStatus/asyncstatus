import type {
  getScheduleContract,
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
import { MemberOrTeamSelect } from "./member-or-team-select";

export type ActionFormContentProps = {
  organizationSlug: string;
  scheduleId: string;
};

export function ActionFormContent(props: ActionFormContentProps) {
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();
  const configName = form.watch("config.name");
  const generateFor = form.watch("config.generateFor");
  const generateForEveryMember = form.watch("config.generateForEveryMember");
  const isAddingGenerateFor = generateFor?.findIndex((field) => field === undefined) !== -1;

  return (
    <div className="flex items-start flex-col gap-4">
      <div className="flex items-center gap-2">
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

        <p className="text-sm text-muted-foreground">{configName === "generateUpdates" && "for"}</p>

        {configName === "generateUpdates" && generateFor?.length === 0 && (
          <FormField
            control={form.control}
            name="config.generateFor"
            render={({ field }) => (
              <MemberOrTeamSelect
                size="default"
                allowEveryone
                type={generateForEveryMember ? "everyone" : undefined}
                placeholder="Select user or team"
                organizationSlug={props.organizationSlug}
                value={undefined}
                onSelect={(type, value) => {
                  if (type === undefined) {
                    form.setValue("config.generateForEveryMember", false);
                    field.onChange([]);
                    return;
                  }

                  if (type === "everyone") {
                    form.setValue("config.generateForEveryMember", true);
                    field.onChange([]);
                    return;
                  }

                  form.setValue("config.generateForEveryMember", false);
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
                <MemberOrTeamSelect
                  size="default"
                  allowEveryone
                  placeholder="Select user or team"
                  organizationSlug={props.organizationSlug}
                  type={field.value?.[index]?.type}
                  value={field.value?.[index]?.value}
                  onSelect={(type, value) => {
                    if (type === undefined) {
                      form.setValue("config.generateForEveryMember", false);
                      field.onChange(generateFor?.filter((_, i) => i !== index) ?? []);
                      return;
                    }

                    if (type === "everyone") {
                      form.setValue("config.generateForEveryMember", true);
                      field.onChange(generateFor?.filter((_, i) => i !== index) ?? []);
                      return;
                    }

                    form.setValue("config.generateForEveryMember", false);
                    field.onChange(
                      generateFor?.map((field, i) => (i === index ? value : field)) ?? [],
                    );
                  }}
                />
              )}
            />
          ))}
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
                field.onChange([...(field.value ?? []), undefined]);
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
        deliverToEveryone:
          previousConfig?.name === "remindToPostUpdates" || previousConfig?.name === "sendSummaries"
            ? previousConfig?.deliverToEveryone
            : false,
        deliveryMethods:
          previousConfig?.name === "remindToPostUpdates" || previousConfig?.name === "sendSummaries"
            ? previousConfig?.deliveryMethods
            : [],
      } as (typeof getScheduleContract.$infer.output)["config"];
    case "generateUpdates":
      return {
        name: "generateUpdates",
        timeOfDay: previousConfig?.timeOfDay ?? "00:00",
        timezone: previousConfig?.timezone ?? "UTC",
        recurrence: previousConfig?.recurrence ?? "daily",
        dayOfWeek: previousConfig?.dayOfWeek ?? undefined,
        dayOfMonth: previousConfig?.dayOfMonth ?? undefined,
        generateFor: [],
        generateForEveryMember: false,
      } as (typeof getScheduleContract.$infer.output)["config"];
    case "sendSummaries":
      return {
        name: "sendSummaries",
        timeOfDay: previousConfig?.timeOfDay ?? "11:00",
        timezone: previousConfig?.timezone ?? "UTC",
        recurrence: previousConfig?.recurrence ?? "daily",
        dayOfWeek: previousConfig?.dayOfWeek ?? undefined,
        dayOfMonth: previousConfig?.dayOfMonth ?? undefined,
        deliverToEveryone:
          previousConfig?.name === "remindToPostUpdates" || previousConfig?.name === "sendSummaries"
            ? previousConfig?.deliverToEveryone
            : false,
        deliveryMethods:
          previousConfig?.name === "remindToPostUpdates" || previousConfig?.name === "sendSummaries"
            ? previousConfig?.deliveryMethods
            : [],
      } as (typeof getScheduleContract.$infer.output)["config"];
  }
}
