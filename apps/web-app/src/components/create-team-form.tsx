import {
  createTeamMutationOptions,
  listTeamsQueryOptions,
} from "@/rpc/organization/teams";
import { zTeamCreate } from "@asyncstatus/api/schema/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";

export function CreateTeamForm(props: {
  organizationSlug: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(zTeamCreate),
    defaultValues: {
      name: "",
    },
  });

  // Create team mutation
  const createTeam = useMutation({
    ...createTeamMutationOptions(),
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: listTeamsQueryOptions(props.organizationSlug).queryKey,
      });

      // Call success callback
      props.onSuccess?.();
      form.reset();
    },
  });

  const isLoading = createTeam.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          createTeam.mutate({
            idOrSlug: props.organizationSlug,
            name: data.name,
          });
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={props.onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isValid}>
            {isLoading ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
