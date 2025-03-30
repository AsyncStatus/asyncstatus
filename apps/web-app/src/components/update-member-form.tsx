import { useState } from "react";
import { sessionQueryOptions } from "@/rpc/auth";
import {
  getActiveMemberQueryOptions,
  getMemberQueryOptions,
  listMembersQueryOptions,
  updateMemberMutationOptions,
} from "@/rpc/organization";
import { zOrganizationMemberUpdate } from "@asyncstatus/api/schema/organization";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@asyncstatus/ui/components/form";
import { ImageUpload } from "@asyncstatus/ui/components/image-upload";
import { Input } from "@asyncstatus/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@asyncstatus/ui/components/popover";
import { Check, ChevronsUpDown } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { authClient, roleOptions } from "@/lib/auth";
import { getFileUrl } from "@/lib/utils";

export function UpdateMemberForm(props: {
  organizationSlug: string;
  memberId: string;
  onSuccess?: (data: {
    id: string;
    createdAt: string;
    userId: string;
    organizationId: string;
    role: string;
    teamId: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }) => void;
}) {
  const queryClient = useQueryClient();
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const [session, member] = useSuspenseQueries({
    queries: [
      sessionQueryOptions(),
      getMemberQueryOptions({
        idOrSlug: props.organizationSlug,
        memberId: props.memberId,
      }),
    ],
  });

  const form = useForm({
    resolver: zodResolver(zOrganizationMemberUpdate),
    defaultValues: {
      firstName: member.data.user.name?.split(" ")[0] ?? "",
      lastName: member.data.user.name?.split(" ")[1] ?? "",
      role: member.data.role as "member" | "admin" | "owner",
      image: member.data.user.image ?? null,
    },
  });

  const updateMember = useMutation({
    ...updateMemberMutationOptions(),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(props.organizationSlug).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getMemberQueryOptions({
          idOrSlug: props.organizationSlug,
          memberId: props.memberId,
        }).queryKey,
      });
      if (data.userId === session.data.user.id) {
        queryClient.invalidateQueries({
          queryKey: sessionQueryOptions().queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: getActiveMemberQueryOptions().queryKey,
        });
      }
      props.onSuccess?.(data);
    },
  });
  const isOwner = authClient.organization.checkRolePermission({
    role: "owner",
    permission: { member: ["update"] },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          updateMember.mutate({
            form: data,
            param: {
              idOrSlug: props.organizationSlug,
              memberId: props.memberId,
            },
          });
        })}
        className="mx-auto w-full space-y-24"
      >
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-5">
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
          </div>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Popover
                    open={rolePopoverOpen}
                    onOpenChange={setRolePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={rolePopoverOpen}
                        className="justify-between"
                      >
                        {field.value
                          ? roleOptions.find(
                              (role) => role.value === field.value,
                            )?.label
                          : "Select role..."}
                        <ChevronsUpDown className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search roles..."
                          className="h-9"
                        />
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
                                    (currentValue === field.value
                                      ? ""
                                      : currentValue) as any,
                                  );
                                  setRolePopoverOpen(false);
                                }}
                              >
                                <div>
                                  <p className="font-medium">{role.label}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {role.description}
                                  </p>
                                </div>
                                <Check
                                  className={cn(
                                    "mt-0.5 ml-auto self-start",
                                    role.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
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
            name="image"
            render={({ field }) => {
              console.log(field.value);
              const value =
                typeof field.value === "string"
                  ? getFileUrl({
                      param: { idOrSlug: props.organizationSlug },
                      query: { fileKey: field.value },
                    })
                  : field.value;

              return (
                <FormItem>
                  <FormLabel className="mb-2">Profile Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={updateMember.isPending}
          >
            Update user
          </Button>
        </div>
      </form>
    </Form>
  );
}
