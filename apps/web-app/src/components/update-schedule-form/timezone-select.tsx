import type { updateScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@asyncstatus/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import { Check, ChevronsUpDown } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "../form";

const timezones = [
  {
    value: "UTC",
    label: "UTC",
  },
  ...Intl.supportedValuesOf("timeZone").map((tz) => ({
    value: tz,
    label: tz.replace(/_/g, " "),
  })),
];

export function TimezoneSelect() {
  const [timezonePopoverOpen, setTimezonePopoverOpen] = useState(false);
  const form = useFormContext<typeof updateScheduleContract.$infer.input>();

  return (
    <FormField
      control={form.control}
      name="timezone"
      render={({ field }) => {
        return (
          <FormItem>
            <Popover open={timezonePopoverOpen} onOpenChange={setTimezonePopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  {/** biome-ignore lint/a11y/useSemanticElements: we're using a button as a combobox */}
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={timezonePopoverOpen}
                    className="w-full justify-between"
                  >
                    {field.value
                      ? timezones.find((timezone) => timezone.value === field.value)?.label
                      : "Select timezone"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search timezone..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No timezone found.</CommandEmpty>
                    <CommandGroup>
                      {timezones.map((timezone) => (
                        <CommandItem
                          key={timezone.value}
                          value={timezone.value}
                          onSelect={(currentValue) => {
                            field.onChange(currentValue);
                            setTimezonePopoverOpen(false);
                          }}
                        >
                          {timezone.label}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              field.value === timezone.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
