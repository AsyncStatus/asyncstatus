import type { updateScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { Input } from "@asyncstatus/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { useFormContext } from "react-hook-form";
import { FormField } from "../form";
import { TimezoneSelect } from "./timezone-select";

export function WhenFormContent() {
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();
  const recurrence = form.watch("config.recurrence");

  return (
    <>
      <FormField
        control={form.control}
        name="config.recurrence"
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              form.setValue("config.dayOfWeek", undefined);
              form.setValue("config.dayOfMonth", undefined);
              form.setValue("config.timeOfDay", "09:30");
            }}
          >
            <SelectTrigger ref={field.ref} onBlur={field.onBlur} disabled={field.disabled}>
              <SelectValue placeholder="Select recurrence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Every day</SelectItem>
              <SelectItem value="weekly">Every week</SelectItem>
              <SelectItem value="monthly">Every month</SelectItem>
            </SelectContent>
          </Select>
        )}
      />

      {recurrence === "weekly" && (
        <div className="flex items-center flex-wrap gap-2">
          <p className="text-sm font-medium text-muted-foreground">on</p>
          <FormField
            control={form.control}
            name="config.dayOfWeek"
            render={({ field }) => (
              <Select
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger ref={field.ref} onBlur={field.onBlur} disabled={field.disabled}>
                  <SelectValue placeholder="Day of week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Monday</SelectItem>
                  <SelectItem value="1">Tuesday</SelectItem>
                  <SelectItem value="2">Wednesday</SelectItem>
                  <SelectItem value="3">Thursday</SelectItem>
                  <SelectItem value="4">Friday</SelectItem>
                  <SelectItem value="5">Saturday</SelectItem>
                  <SelectItem value="6">Sunday</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {recurrence === "monthly" && (
        <div className="flex items-center flex-wrap gap-2">
          <p className="text-sm font-medium text-muted-foreground">on the</p>
          <FormField
            control={form.control}
            name="config.dayOfMonth"
            render={({ field }) => (
              <Select
                value={field.value?.toString()}
                onValueChange={(value) => field.onChange(Number(value))}
              >
                <SelectTrigger ref={field.ref} onBlur={field.onBlur} disabled={field.disabled}>
                  <SelectValue placeholder="Day of month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem
                      // biome-ignore lint/suspicious/noArrayIndexKey: it's fine
                      key={`${i}`}
                      value={`${i}`}
                    >
                      {i + 1}
                      {i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-sm font-medium text-muted-foreground">day</p>
        </div>
      )}

      {(recurrence === "daily" || recurrence === "weekly" || recurrence === "monthly") && (
        <div className="flex items-center flex-wrap gap-2">
          <p className="text-sm font-medium text-muted-foreground">at</p>
          <FormField
            control={form.control}
            name="config.timeOfDay"
            render={({ field }) => (
              <Input
                {...field}
                type="time"
                step="60"
                defaultValue="09:30"
                className="w-fit bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            )}
          />
          <TimezoneSelect />
        </div>
      )}
    </>
  );
}
