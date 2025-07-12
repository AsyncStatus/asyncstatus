import {
  getTeamContract,
  listTeamsContract,
  updateTeamContract,
} from "@asyncstatus/api/typed-handlers/team";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export function UpdateTeamForm(props: {
  organizationSlug: string;
  teamId: string;
  onSuccess?: (data: typeof updateTeamContract.$infer.output) => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: teamData, isLoading: teamLoading } = useQuery(
    typedQueryOptions(getTeamContract, { idOrSlug: props.organizationSlug, teamId: props.teamId }),
  );

  const form = useForm({
    resolver: zodResolver(updateTeamContract.inputSchema),
    defaultValues: {
      idOrSlug: props.organizationSlug,
      teamId: props.teamId,
      name: teamData?.name || "",
    },
  });

  useEffect(() => {
    if (teamData) {
      form.reset({
        idOrSlug: props.organizationSlug,
        teamId: props.teamId,
        name: teamData.name,
      });
    }
  }, [teamData, form]);

  const updateTeam = useMutation(
    typedMutationOptions(updateTeamContract, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getTeamContract, {
            idOrSlug: props.organizationSlug,
            teamId: props.teamId,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug })
            .queryKey,
        });

        props.onSuccess?.(data);
        form.reset();
      },
    }),
  );

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
          <Button type="button" variant="outline" onClick={props.onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isValid}>
            Update team
          </Button>
        </div>
      </form>
    </Form>
  );
}
