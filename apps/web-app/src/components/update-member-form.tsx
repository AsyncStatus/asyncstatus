import { useEffect, useState } from "react";
import { sessionQueryOptions } from "@/rpc/auth";
import {
  getMemberQueryOptions,
  listMembersQueryOptions,
  updateMemberMutationOptions,
} from "@/rpc/organization/member";
import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
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

import { roleOptions } from "@/lib/auth";
import { getFileUrl } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";

// Type for Slack users
interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    image_24?: string;
    display_name: string;
  };
}

export function UpdateMemberForm(props: {
  organizationSlug: string;
  memberId: string;
  onSuccess?: (data: {
    id: string;
    createdAt: string;
    userId: string;
    organizationId: string;
    role: string;
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
  const [slackUsersPopoverOpen, setSlackUsersPopoverOpen] = useState(false);
  const [slackUsers, setSlackUsers] = useState<SlackUser[]>([]);
  const [isLoadingSlackUsers, setIsLoadingSlackUsers] = useState(false);
  const [session, member, organization] = useSuspenseQueries({
    queries: [
      sessionQueryOptions(),
      getMemberQueryOptions({
        idOrSlug: props.organizationSlug,
        memberId: props.memberId,
      }),
      getOrganizationQueryOptions(props.organizationSlug),
    ],
  });

  const form = useForm({
    resolver: zodResolver(zOrganizationMemberUpdate),
    defaultValues: {
      firstName: member.data.user.name?.split(" ")[0] ?? "",
      lastName: member.data.user.name?.split(" ").slice(1).join(" ") ?? "",
      role: member.data.role as "member" | "admin" | "owner",
      image: member.data.user.image ?? null,
      slackUsername: member.data.slackUsername ?? "",
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
          queryKey: getOrganizationQueryOptions(props.organizationSlug)
            .queryKey,
        });
      }
      props.onSuccess?.(data);
    },
  });
  const isOwner = organization.data.member.role === "owner";

  // Fetch Slack users when component mounts
  useEffect(() => {
    async function fetchSlackUsers() {
      setIsLoadingSlackUsers(true);
      try {
        const response = await fetch(`/api/organization/${props.organizationSlug}/slack/users`);
        if (response.ok) {
          const data = await response.json() as { users: SlackUser[] };
          setSlackUsers(data.users || []);
        } else {
          console.error("Failed to fetch Slack users");
        }
      } catch (error) {
        console.error("Error fetching Slack users:", error);
      } finally {
        setIsLoadingSlackUsers(false);
      }
    }
    
    fetchSlackUsers();
  }, [props.organizationSlug]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          updateMember.mutate({
            form: data as any,
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
            name="slackUsername"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slack User</FormLabel>
                <FormControl>
                  <Popover
                    open={slackUsersPopoverOpen}
                    onOpenChange={setSlackUsersPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={slackUsersPopoverOpen}
                        className="justify-between"
                      >
                        {field.value 
                          ? `@${field.value}` 
                          : "Select Slack user..."}
                        {isLoadingSlackUsers ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <ChevronsUpDown className="opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[300px]" side="bottom" align="start" alignOffset={0}>
                      <Command>
                        <CommandInput
                          placeholder="Search Slack users..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No Slack users found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                form.setValue("slackUsername", "");
                                setSlackUsersPopoverOpen(false);
                              }}
                            >
                              <div className="flex items-center">
                                <div className="ml-2">
                                  <p className="font-medium">Not connected</p>
                                  <p className="text-muted-foreground text-xs">
                                    Disconnect from Slack
                                  </p>
                                </div>
                                <Check
                                  className={cn(
                                    "mt-0.5 ml-auto self-start",
                                    !field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </div>
                            </CommandItem>
                            {slackUsers.map((slackUser) => (
                              <CommandItem
                                key={slackUser.id}
                                value={slackUser.name}
                                onSelect={() => {
                                  form.setValue("slackUsername", slackUser.name);
                                  setSlackUsersPopoverOpen(false);
                                }}
                              >
                                <div className="flex items-center">
                                  {slackUser.profile.image_24 && (
                                    <img 
                                      src={slackUser.profile.image_24} 
                                      alt={slackUser.name} 
                                      className="h-5 w-5 rounded mr-2" 
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium">@{slackUser.name}</p>
                                    <p className="text-muted-foreground text-xs">
                                      {slackUser.real_name || slackUser.profile.display_name}
                                    </p>
                                  </div>
                                  <Check
                                    className={cn(
                                      "mt-0.5 ml-auto self-start",
                                      slackUser.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Connect this user to their Slack account for the /asyncstatus command
                </p>
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
