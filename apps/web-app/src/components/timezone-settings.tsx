import { sessionQueryOptions } from "@/rpc/auth";
import { updateTimezoneMutationOptions } from "@/rpc/organization/member";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@asyncstatus/ui/components/select";
import { toast } from "@asyncstatus/ui/components/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

const timezoneSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
});

type TimezoneFormValues = z.infer<typeof timezoneSchema>;

// Common timezones list
const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Shanghai", label: "China Standard Time" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

export function TimezoneSettings({ organizationSlug }: { organizationSlug: string }) {
  const queryClient = useQueryClient();
  const session = useSuspenseQuery(sessionQueryOptions());
  
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
      queryClient.invalidateQueries({ queryKey: sessionQueryOptions().queryKey });
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
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Your timezone will be used to display dates and times correctly. Status updates
                will capture the timezone they were created in.
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