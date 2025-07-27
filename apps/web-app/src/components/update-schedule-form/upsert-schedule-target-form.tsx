import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import { getScheduleContract } from "@asyncstatus/api/typed-handlers/schedule";
import {
  getScheduleTargetContract,
  upsertScheduleTargetContract,
} from "@asyncstatus/api/typed-handlers/schedule-target";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
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
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useDebouncedCallback from "@/lib/use-debounced-callback";
import { getInitials } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { Form, FormControl, FormField, FormItem } from "../form";

export type UpsertScheduleTargetFormProps = {
  organizationSlug: string;
  scheduleId: string;
  targetId?: string;
};

function UpsertScheduleTargetFormUnmemoized(props: UpsertScheduleTargetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const target = useQuery(
    typedQueryOptions(
      getScheduleTargetContract,
      props.targetId
        ? {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
            targetId: props.targetId,
          }
        : skipToken,
      { initialData: keepPreviousData },
    ),
  );
  const members = useQuery(
    typedQueryOptions(listMembersContract, { idOrSlug: props.organizationSlug }),
  );
  const teams = useQuery(
    typedQueryOptions(listTeamsContract, { idOrSlug: props.organizationSlug }),
  );
  const upsertTarget = useMutation(
    typedMutationOptions(upsertScheduleTargetContract, {
      onSuccess: (data) => {
        queryClient.setQueryData(
          typedQueryOptions(getScheduleContract, {
            idOrSlug: props.organizationSlug,
            scheduleId: props.scheduleId,
          }).queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              targets: [...oldData.targets.filter((target) => target.id !== data.id), data].sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
              ),
            };
          },
        );
        if (data.id) {
          queryClient.setQueryData(
            typedQueryOptions(getScheduleTargetContract, {
              idOrSlug: props.organizationSlug,
              scheduleId: props.scheduleId,
              targetId: data.id,
            }).queryKey,
            data,
          );
        }
      },
    }),
  );

  const form = useForm({
    resolver: zodResolver(upsertScheduleTargetContract.inputSchema),
    defaultValues: {
      id: props.targetId,
      idOrSlug: props.organizationSlug,
      scheduleId: props.scheduleId,
      memberId: target.data?.memberId,
      teamId: target.data?.teamId,
      targetType: target.data?.targetType,
    },
  });

  useEffect(() => {
    form.reset({
      id: props.targetId,
      idOrSlug: props.organizationSlug,
      scheduleId: props.scheduleId,
      memberId: target.data?.memberId,
      teamId: target.data?.teamId,
      targetType: target.data?.targetType,
    });
  }, [
    target.data?.memberId,
    target.data?.teamId,
    target.data?.targetType,
    props.organizationSlug,
    props.scheduleId,
    props.targetId,
  ]);

  const onSubmit = useCallback(
    (data: typeof upsertScheduleTargetContract.$infer.input) => {
      if (form.formState.isSubmitting || !form.formState.isValid || !form.formState.isDirty) {
        return;
      }
      upsertTarget.mutate(data);
    },
    [upsertTarget, form.formState.isSubmitting, form.formState.isValid, form.formState.isDirty],
  );

  const debouncedOnSubmit = useDebouncedCallback(onSubmit, 500);

  useEffect(() => {
    if (form.formState.isSubmitting || !form.formState.isValid || !form.formState.isDirty) {
      return;
    }
    debouncedOnSubmit(form.getValues());
  }, [
    debouncedOnSubmit,
    form.formState.isSubmitting,
    form.formState.isValid,
    form.formState.isDirty,
  ]);

  const memberId = form.watch("memberId");
  const teamId = form.watch("teamId");
  const targetType = form.watch("targetType");
  const label = useMemo(() => {
    if (targetType === "organization") {
      return (
        <div className="flex items-center gap-2">
          <Users className="size-4" />
          <span>Everyone</span>
        </div>
      );
    }
    if (targetType === "team") {
      const team = teams.data?.find((team) => team.id === teamId);
      if (!team) {
        return "Unknown team";
      }
      return team.name;
    }
    if (targetType === "member") {
      const member = members.data?.members.find((member) => member.id === memberId);
      if (!member) {
        return "Unknown member";
      }
      return (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage
              src={typedUrl(getFileContract, {
                idOrSlug: props.organizationSlug,
                fileKey: member.user.image ?? "",
              })}
            />
            <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
          </Avatar>
          <span>{member.user.name}</span>
        </div>
      );
    }
    return "Select user or team";
  }, [members.data, memberId, props.organizationSlug, teams.data, teamId, targetType]);

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="targetType"
        render={({ field }) => (
          <FormItem>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  {/** biome-ignore lint/a11y/useSemanticElements: it's fine to use a button as a combobox */}
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between"
                  >
                    {label}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search users or teams..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No users or teams found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="organization"
                        onSelect={() => {
                          form.setValue("teamId", undefined);
                          form.setValue("memberId", undefined);
                          form.setValue("targetType", "organization");
                          field.onChange("organization");
                          setIsOpen(false);
                        }}
                      >
                        <Users className="size-4" />
                        <span>Everyone</span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            field.value === "organization" ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    </CommandGroup>

                    <CommandGroup heading="Users">
                      {members.data?.members.map((member) => (
                        <CommandItem
                          key={member.id}
                          value={member.id}
                          onSelect={() => {
                            form.setValue("teamId", undefined);
                            form.setValue("memberId", member.id);
                            form.setValue("targetType", "member");
                            field.onChange("member");
                            setIsOpen(false);
                          }}
                        >
                          <Avatar>
                            <AvatarImage
                              src={typedUrl(getFileContract, {
                                idOrSlug: props.organizationSlug,
                                fileKey: member.user.image ?? "",
                              })}
                            />
                            <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                          </Avatar>
                          <span>{member.user.name}</span>
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              memberId === member.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>

                    <CommandGroup heading="Teams">
                      {teams.data?.length === 0 && (
                        <CommandItem disabled>No teams to select.</CommandItem>
                      )}
                      {teams.data?.map((team) => (
                        <CommandItem
                          key={team.id}
                          value={team.id}
                          onSelect={() => {
                            form.setValue("memberId", undefined);
                            form.setValue("teamId", team.id);
                            form.setValue("targetType", "team");
                            field.onChange("team");
                            setIsOpen(false);
                          }}
                        >
                          {team.name}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              teamId === team.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormItem>
        )}
      />
    </Form>
  );
}

export const UpsertScheduleTargetForm = memo(
  UpsertScheduleTargetFormUnmemoized,
  (prevProps, nextProps) => {
    return (
      prevProps.organizationSlug === nextProps.organizationSlug &&
      prevProps.scheduleId === nextProps.scheduleId &&
      prevProps.targetId === nextProps.targetId
    );
  },
);
