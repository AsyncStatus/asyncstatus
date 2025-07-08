import { zTeamMemberAdd } from "@asyncstatus/api/schema/organization";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { listMembersQueryOptions } from "@/rpc/organization/member";
import {
  addTeamMemberMutationOptions,
  getTeamMembersQueryOptions,
  getTeamQueryOptions,
} from "@/rpc/organization/teams";

export function AddTeamMemberForm(props: {
  organizationSlug: string;
  teamId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(zTeamMemberAdd),
    defaultValues: {
      memberId: "",
    },
  });

  // Query to get all organization members to show in the dropdown
  const { data: membersData, isLoading: membersLoading } = useQuery(
    listMembersQueryOptions(props.organizationSlug),
  );

  // Query to get current team members to filter them out
  const { data: teamMembers, isLoading: teamMembersLoading } = useQuery(
    getTeamMembersQueryOptions(props.organizationSlug, props.teamId),
  );

  // Add member mutation
  const addMember = useMutation({
    ...addTeamMemberMutationOptions(),
    onSuccess: () => {
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: getTeamQueryOptions(props.organizationSlug, props.teamId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getTeamMembersQueryOptions(props.organizationSlug, props.teamId).queryKey,
      });

      // Call success callback and reset form
      props.onSuccess?.();
      form.reset();
    },
  });

  // Filter out members who are already in the team
  const availableMembers =
    membersData?.members?.filter(
      (member) =>
        !teamMembers?.some((teamMember) => teamMember.member.id === member.id) &&
        // Also filter out archived members
        member.archivedAt === null,
    ) || [];

  const isLoading = membersLoading || teamMembersLoading || addMember.isPending;

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
                <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                  <PopoverTrigger asChild>
                    {/** biome-ignore lint/a11y/useSemanticElements: we're using a button as a trigger for a popover */}
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={memberPopoverOpen}
                      className="w-full justify-between"
                      disabled={isLoading}
                    >
                      {field.value
                        ? availableMembers.find((member) => member.id === field.value)?.user
                            ?.name || "Select user..."
                        : "Select user..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {availableMembers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={(value) => {
                                form.setValue("memberId", value);
                                setMemberPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === user.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{user.user.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  {user.user.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
