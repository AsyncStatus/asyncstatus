import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  getMemberContract,
  listMembersContract,
  updateMemberContract,
} from "@asyncstatus/api/typed-handlers/member";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import { serializeFormData } from "@asyncstatus/typed-handlers";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@asyncstatus/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { ImageUpload } from "@asyncstatus/ui/components/image-upload";
import { Input } from "@asyncstatus/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@asyncstatus/ui/components/popover";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Check, ChevronsUpDown, Edit } from "@asyncstatus/ui/icons";
import { getIsFormDataChanged } from "@asyncstatus/ui/lib/get-is-form-data-changed";
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@asyncstatus/ui/lib/zod-resolver";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/form";
import { roleOptions } from "@/lib/auth";
import { sessionBetterAuthQueryOptions } from "@/rpc/auth";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";
import { Form } from "./form";

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

export function UpdateMemberForm(props: {
  organizationSlugOrId: string;
  memberId: string;
  onSuccess?: (data: typeof updateMemberContract.$infer.output) => void;
}) {
  const queryClient = useQueryClient();
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const [timezonePopoverOpen, setTimezonePopoverOpen] = useState(false);
  const session = useQuery(sessionBetterAuthQueryOptions());
  const member = useQuery(
    typedQueryOptions(getMemberContract, {
      idOrSlug: props.organizationSlugOrId,
      memberId: props.memberId,
    }),
  );
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, {
      idOrSlug: props.organizationSlugOrId,
    }),
  );
  const isOwner = organization.data.member.role === "owner";
  const form = useForm<
    typeof updateMemberContract.$infer.input,
    typeof updateMemberContract.$infer.output
  >({
    resolver: zodResolver(updateMemberContract.inputSchema),
    defaultValues: {
      idOrSlug: props.organizationSlugOrId,
      memberId: props.memberId,
      firstName: member.data?.user.name?.split(" ")[0] ?? "",
      lastName: member.data?.user.name?.split(" ").slice(1).join(" ") ?? "",
      role: member.data?.role,
      image: member.data?.user.image ?? null,
      archivedAt: member.data?.archivedAt ?? null,
      timezone: member.data?.user.timezone,
    },
  });

  useEffect(() => {
    if (member.data) {
      form.reset({
        idOrSlug: props.organizationSlugOrId,
        memberId: props.memberId,
        firstName: member.data?.user.name?.split(" ")[0] ?? "",
        lastName: member.data?.user.name?.split(" ").slice(1).join(" ") ?? "",
        role: member.data?.role,
        image: member.data?.user.image ?? null,
        archivedAt: member.data?.archivedAt ?? null,
        timezone: member.data?.user.timezone,
      });
    }
  }, [member.data, props.organizationSlugOrId, props.memberId]);

  const updateMember = useMutation({
    ...typedMutationOptions(updateMemberContract),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: typedQueryOptions(listMembersContract, {
          idOrSlug: props.organizationSlugOrId,
        }).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: typedQueryOptions(getMemberContract, {
          idOrSlug: props.organizationSlugOrId,
          memberId: props.memberId,
        }).queryKey,
      });
      if (data.userId === session.data?.user.id) {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getOrganizationContract, {
            idOrSlug: props.organizationSlugOrId,
          }).queryKey,
        });

        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            user: {
              ...sessionData.user,
              timezone: data.user.timezone,
              image: data.user.image,
              name: data.user.name,
            },
          };
        });
      }
      form.reset({
        idOrSlug: props.organizationSlugOrId,
        memberId: props.memberId,
        firstName: data.user.name?.split(" ")[0] ?? "",
        lastName: data.user.name?.split(" ").slice(1).join(" ") ?? "",
        role: data.role,
        image: data.user.image ?? null,
        archivedAt: data.archivedAt ?? null,
        timezone: data.user.timezone,
      });
      props.onSuccess?.(data);
    },
  });

  useEffect(() => {
    form.setValue("idOrSlug", props.organizationSlugOrId);
    form.setValue("memberId", props.memberId);
  }, [props.organizationSlugOrId, props.memberId]);

  return (
    <Form {...form}>
      <form
        className="mx-auto w-full grid grid-cols-2 gap-5"
        onSubmit={form.handleSubmit((data) => {
          if (!getIsFormDataChanged(data, form.formState.defaultValues)) {
            toast.info("No changes to save", { id: "update-member-form-no-changes" });
            return;
          }

          updateMember.mutate(serializeFormData(data));
        })}
      >
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
                  <PopoverTrigger asChild>
                    {/** biome-ignore lint/a11y/useSemanticElements: we're using select */}
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={rolePopoverOpen}
                      className="justify-between"
                    >
                      {field.value
                        ? roleOptions.find((role) => role.value === field.value)?.label
                        : "Select role..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Command>
                      <CommandInput placeholder="Search roles..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No role found.</CommandEmpty>
                        <CommandGroup>
                          {roleOptions.map((role) => (
                            <CommandItem
                              key={role.value}
                              value={role.value}
                              disabled={role.value === "owner" && !isOwner}
                              onSelect={(currentValue) => {
                                form.setValue(
                                  "role",
                                  (currentValue === field.value ? "" : currentValue) as any,
                                );
                                setRolePopoverOpen(false);
                              }}
                            >
                              <div>
                                <p className="font-medium">{role.label}</p>
                                <p className="text-muted-foreground text-xs">{role.description}</p>
                              </div>
                              <Check
                                className={cn(
                                  "mt-0.5 ml-auto self-start",
                                  role.value === field.value ? "opacity-100" : "opacity-0",
                                )}
                              />
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

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Timezone</FormLabel>
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
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => {
            const value =
              typeof field.value === "string"
                ? typedUrl(getFileContract, {
                    idOrSlug: props.organizationSlugOrId,
                    fileKey: field.value,
                  })
                : field.value;

            return (
              <FormItem className="col-span-2">
                <FormLabel className="mb-2">Profile Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    onBlur={field.onBlur}
                    value={value instanceof File ? undefined : value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit" className="w-full col-span-2" disabled={updateMember.isPending}>
          Save
        </Button>
      </form>
    </Form>
  );
}

export function UpdateMemberFormDialog(props: {
  small?: boolean;
  organizationSlugOrId: string;
  memberId: string;
  onSuccess?: (data: typeof updateMemberContract.$infer.output) => void;
}) {
  const [updateMemberDialogOpen, setUpdateMemberDialogOpen] = useState(false);
  const member = useQuery(
    typedQueryOptions(getMemberContract, {
      idOrSlug: props.organizationSlugOrId,
      memberId: props.memberId,
    }),
  );

  return (
    <Dialog open={updateMemberDialogOpen} onOpenChange={setUpdateMemberDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size={props.small ? "sm" : "default"}
          variant="secondary"
          disabled={member.data?.archivedAt !== null}
          title={member.data?.archivedAt !== null ? "Cannot edit archived user" : "Edit user"}
          onClick={() => {
            if (member.data?.archivedAt !== null) {
              toast.info("Cannot edit archived user");
              return;
            }
            setUpdateMemberDialogOpen(true);
          }}
        >
          <Edit className="size-4" />
          {props.small ? null : <span>Edit</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update user</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <Suspense fallback={<Skeleton className="h-[322px]" />}>
          <UpdateMemberForm
            organizationSlugOrId={props.organizationSlugOrId}
            memberId={props.memberId}
            onSuccess={(data) => {
              setUpdateMemberDialogOpen(false);
              props.onSuccess?.(data);
            }}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
