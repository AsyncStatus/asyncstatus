import {
  addTeamMemberContract,
  getTeamContract,
  getTeamMembersContract,
} from "@asyncstatus/api/typed-handlers/team";
import { Button } from "@asyncstatus/ui/components/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { typedMutationOptions, typedQueryOptions } from "@/typed-handlers";
import { MemberSelect } from "./member-select";

export function AddTeamMemberForm(props: {
  organizationSlug: string;
  teamId: string;
  onSuccess?: (data: typeof addTeamMemberContract.$infer.output) => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(addTeamMemberContract.inputSchema),
    defaultValues: {
      idOrSlug: props.organizationSlug,
      teamId: props.teamId,
      memberId: undefined,
    },
  });

  useEffect(() => {
    form.reset({ idOrSlug: props.organizationSlug, teamId: props.teamId });
  }, [props.organizationSlug, props.teamId]);

  const addMember = useMutation(
    typedMutationOptions(addTeamMemberContract, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getTeamContract, {
            idOrSlug: props.organizationSlug,
            teamId: props.teamId,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getTeamMembersContract, {
            idOrSlug: props.organizationSlug,
            teamId: props.teamId,
          }).queryKey,
        });

        props.onSuccess?.(data);
        form.reset();
      },
    }),
  );

  const isLoading = addMember.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          addMember.mutate({
            idOrSlug: props.organizationSlug,
            teamId: props.teamId,
            memberId: data.memberId,
          });
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select user</FormLabel>
              <FormControl>
                <MemberSelect
                  organizationSlug={props.organizationSlug}
                  value={field.value}
                  onSelect={field.onChange}
                  placeholder="Select user"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            Add member
          </Button>
        </div>
      </form>
    </Form>
  );
}
