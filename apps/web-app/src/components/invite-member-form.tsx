import { useState } from "react";
import {
  inviteMemberMutationOptions,
  listMembersQueryOptions,
} from "@/rpc/organization";
import { zOrganizationCreateInvite } from "@asyncstatus/api/schema/organization";
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
import { Input } from "@asyncstatus/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@asyncstatus/ui/components/popover";
import { Check, ChevronsUpDown } from "@asyncstatus/ui/icons";
import { cn } from "@asyncstatus/ui/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { authClient, roleOptions } from "@/lib/auth";

export function InviteMemberForm(props: {
  organizationSlug: string;
  onSuccess?: (data: {
    id: string;
    email: string;
    status: "pending" | "accepted" | "rejected" | "canceled";
    expiresAt: string;
    organizationId: string;
    role: string;
    inviterId: string;
    teamId?: string | undefined;
  }) => void;
}) {
  const queryClient = useQueryClient();
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(zOrganizationCreateInvite),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "member" as const,
    },
  });
  const inviteMember = useMutation({
    ...inviteMemberMutationOptions(),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(props.organizationSlug).queryKey,
      });
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
          inviteMember.mutate({
            param: { idOrSlug: props.organizationSlug },
            json: {
              email: data.email,
              role: data.role,
              firstName: data.firstName,
              lastName: data.lastName,
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" {...field} />
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
          <Button
            type="submit"
            className="w-full"
            disabled={inviteMember.isPending}
          >
            Invite user
          </Button>
        </div>
      </form>
    </Form>
  );
}
