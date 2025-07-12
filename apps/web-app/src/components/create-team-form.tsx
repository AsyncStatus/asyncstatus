import { createTeamContract, listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { Button } from "@asyncstatus/ui/components/button";
import { Input } from "@asyncstatus/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";

export function CreateTeamForm(props: {
  organizationSlug: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createTeamContract.inputSchema),
    defaultValues: { idOrSlug: props.organizationSlug, name: "" },
  });

  useEffect(() => {
    form.reset({ idOrSlug: props.organizationSlug });
  }, [props.organizationSlug]);

  const createTeam = useMutation(
    typedMutationOptions(createTeamContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listTeamsContract, {
            idOrSlug: props.organizationSlug,
          }).queryKey,
        });

        props.onSuccess?.();
        form.reset();
      },
    }),
  );

  const isLoading = createTeam.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          createTeam.mutate({ idOrSlug: props.organizationSlug, name: data.name });
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
            Create team
          </Button>
        </div>
      </form>
    </Form>
  );
}
