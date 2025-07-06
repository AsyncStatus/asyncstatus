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
import { toast } from "@asyncstatus/ui/components/sonner";
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { sessionQueryOptions } from "@/rpc/auth";
import { updateTimezoneMutationOptions } from "@/rpc/organization/member";

const timezoneSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
});

type TimezoneFormValues = z.infer<typeof timezoneSchema>;

export function TimezoneSettings({ organizationSlug }: { organizationSlug: string }) {
  const queryClient = useQueryClient();
  const session = useSuspenseQuery(sessionQueryOptions());
  const [open, setOpen] = useState(false);

  const timezones = useMemo(
    () => [
      {
        value: "UTC",
        label: "UTC",
      },
      ...Intl.supportedValuesOf("timeZone").map((tz) => ({
        value: tz,
        label: tz.replace(/_/g, " "),
      })),
    ],
    [],
  );

  const form = useForm<TimezoneFormValues>({
    resolver: zodResolver(timezoneSchema),
    defaultValues: {
      timezone: session.data.user.timezone || "UTC",
    },
  });

  const updateTimezoneMutation = useMutation({
    ...updateTimezoneMutationOptions(),
    onSuccess: () => {
      toast.success("Timezone updated successfully");
      queryClient.invalidateQueries({
        queryKey: sessionQueryOptions().queryKey,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update timezone");
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          updateTimezoneMutation.mutate({
            param: { idOrSlug: organizationSlug },
            json: values,
          });
        })}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Timezone</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    {/** biome-ignore lint/a11y/useSemanticElements: we're using a button as a combobox */}
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {field.value
                        ? timezones.find((timezone) => timezone.value === field.value)?.label
                        : "Select a timezone..."}
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
                              field.onChange(currentValue === field.value ? "" : currentValue);
                              setOpen(false);
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
              <FormDescription>
                Your timezone will be used to display dates and times correctly. Status updates will
                capture the timezone they were created in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={updateTimezoneMutation.isPending}>
          {updateTimezoneMutation.isPending ? "Saving..." : "Save timezone"}
        </Button>
      </form>
    </Form>
  );
}
