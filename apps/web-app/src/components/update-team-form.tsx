import { useEffect } from "react";
import {
  getTeamQueryOptions,
  listTeamsQueryOptions,
  updateTeamMutationOptions,
} from "@/rpc/organization/teams";
import { zTeamUpdate } from "@asyncstatus/api/schema/organization";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";

export function UpdateTeamForm(props: {
  organizationSlug: string;
  teamId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();

  // Get current team data
  const { data: teamData, isLoading: teamLoading } = useQuery(
    getTeamQueryOptions(props.organizationSlug, props.teamId),
  );

  const form = useForm({
    resolver: zodResolver(zTeamUpdate),
    defaultValues: {
      name: teamData?.name || "",
    },
  });

  // Update form values when teamData loads
  useEffect(() => {
    if (teamData) {
      form.reset({
        name: teamData.name,
      });
    }
  }, [teamData, form]);

  // Update team mutation
  const updateTeam = useMutation({
    ...updateTeamMutationOptions(),
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: getTeamQueryOptions(props.organizationSlug, props.teamId)
          .queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: listTeamsQueryOptions(props.organizationSlug).queryKey,
      });

      // Call success callback
      props.onSuccess?.();
      form.reset();
    },
  });

  const isLoading = teamLoading || updateTeam.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          updateTeam.mutate({
            idOrSlug: props.organizationSlug,
            teamId: props.teamId,
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
            {isLoading ? "Updating..." : "Update Team"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
