import { Suspense, useState, useEffect } from "react";
import {
  getMemberQueryOptions,
  listMembersQueryOptions,
  updateMemberMutationOptions,
} from "@/rpc/organization/member";
import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@asyncstatus/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@asyncstatus/ui/components/dialog";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@asyncstatus/ui/components/tabs";
import {
  Archive,
  Calendar,
  Copy,
  Edit,
  Mail,
  Trash,
  Users,
} from "@asyncstatus/ui/icons";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { cn } from "@asyncstatus/ui/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@asyncstatus/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@asyncstatus/ui/components/command";
import { Check } from "lucide-react";

import { getFileUrl, getInitials } from "@/lib/utils";
import { UpdateMemberForm } from "@/components/update-member-form";

export const Route = createFileRoute(
  "/$organizationSlug/_layout/users/$userId",
)({
  component: RouteComponent,
  loader: async ({
    context: { queryClient },
    params: { organizationSlug, userId },
  }) => {
    await Promise.all([
      queryClient.ensureQueryData(
        getMemberQueryOptions({ idOrSlug: organizationSlug, memberId: userId }),
      ),
      queryClient.ensureQueryData(
        getOrganizationQueryOptions(organizationSlug),
      ),
    ]);
  },
});

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

function RouteComponent() {
  const { organizationSlug, userId } = Route.useParams();
  const queryClient = useQueryClient();
  const [updateMemberDialogOpen, setUpdateMemberDialogOpen] = useState(false);
  const [member, organization] = useSuspenseQueries({
    queries: [
      getMemberQueryOptions({ idOrSlug: organizationSlug, memberId: userId }),
      getOrganizationQueryOptions(organizationSlug),
    ],
  });
  const updateMember = useMutation({
    ...updateMemberMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(organizationSlug).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getMemberQueryOptions({
          idOrSlug: organizationSlug,
          memberId: userId,
        }).queryKey,
      });
    },
  });
  const isAdmin =
    organization.data.member.role === "admin" ||
    organization.data.member.role === "owner";
  const { user, role, createdAt, teamMemberships, archivedAt } = member.data;
  const joinDate = createdAt ? format(new Date(createdAt), "PPP") : "N/A";
  const archiveDate = archivedAt ? format(new Date(archivedAt), "PPP") : null;
  const isArchived = Boolean(archivedAt);
  const [slackUsersPopoverOpen, setSlackUsersPopoverOpen] = useState(false);
  const [slackUsers, setSlackUsers] = useState<SlackUser[]>([]);
  const [isLoadingSlackUsers, setIsLoadingSlackUsers] = useState(false);

  // Function to render the appropriate badge based on role
  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "owner":
        return <Badge variant="default">Owner</Badge>;
      case "admin":
        return <Badge variant="secondary">Admin</Badge>;
      case "member":
        return <Badge variant="outline">Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Fetch Slack users when component mounts
  useEffect(() => {
    async function fetchSlackUsers() {
      if (!isAdmin || isArchived) return;
      
      setIsLoadingSlackUsers(true);
      try {
        const response = await fetch(`/api/organization/${organizationSlug}/slack/users`);
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
  }, [organizationSlug, isAdmin, isArchived]);

  // Function to update the member's Slack username
  const updateSlackUsername = (slackUsername: string | null) => {
    updateMember.mutate({
      param: {
        idOrSlug: organizationSlug,
        memberId: member.data.id,
      },
      form: { slackUsername },
    });
    setSlackUsersPopoverOpen(false);
  };

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/$organizationSlug/users"
                    params={{ organizationSlug }}
                  >
                    Users
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{user.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex gap-2">
          {isAdmin && isArchived && (
            <Button
              variant="secondary"
              disabled={updateMember.isPending}
              onClick={() => {
                updateMember.mutate({
                  param: {
                    idOrSlug: organizationSlug,
                    memberId: member.data.id,
                  },
                  form: { archivedAt: null as any },
                });
              }}
              className="flex-initial"
              title="Restore this user to active status"
            >
              <Archive className="size-4" />
              <span>Unarchive user</span>
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="destructive"
              disabled={updateMember.isPending || isArchived}
              onClick={() => {
                if (organization.data.member.id === member.data.id) {
                  toast.info("You cannot remove your own account");
                  return;
                }

                updateMember.mutate({
                  param: {
                    idOrSlug: organizationSlug,
                    memberId: member.data.id,
                  },
                  form: { archivedAt: new Date().toISOString() },
                });
              }}
              className="flex-initial"
              title={isArchived ? "Cannot remove archived user" : "Remove user"}
            >
              <Trash className="size-4" />
              <span>Remove user</span>
            </Button>
          )}

          {isAdmin && (
            <Dialog
              open={updateMemberDialogOpen}
              onOpenChange={setUpdateMemberDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  disabled={isArchived}
                  title={isArchived ? "Cannot edit archived user" : "Edit user"}
                >
                  <Edit className="size-4" />
                  <span>Edit user</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update user</DialogTitle>
                  <DialogDescription>
                    Update user&apos;s role or other details.
                  </DialogDescription>
                </DialogHeader>

                <Suspense fallback={<Skeleton className="h-[322px]" />}>
                  <UpdateMemberForm
                    organizationSlug={organizationSlug}
                    memberId={member.data.id}
                    onSuccess={() => {
                      setUpdateMemberDialogOpen(false);
                    }}
                  />
                </Suspense>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="container mx-auto space-y-8 py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* User Profile Card */}
          <Card className={`w-full md:w-1/3 ${isArchived ? "opacity-90" : ""}`}>
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar
                className={`mb-4 size-24 ${isArchived ? "grayscale" : ""}`}
              >
                <AvatarImage
                  src={
                    user.image
                      ? getFileUrl({
                          param: { idOrSlug: organizationSlug },
                          query: { fileKey: user.image },
                        })
                      : undefined
                  }
                  alt={user.name}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <div className="text-muted-foreground mt-1 flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    toast.promise(navigator.clipboard.writeText(user.email), {
                      loading: "Copying email...",
                      success: "Email copied to clipboard",
                      error: "Failed to copy email",
                    });
                  }}
                >
                  <Copy className="size-3" />
                  {user.email}
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                {getRoleBadge(role)}
                {isArchived && <Badge variant="destructive">Archived</Badge>}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-muted-foreground size-3" />
                  <span>Joined on {joinDate}</span>
                </div>
                {isArchived && (
                  <div className="flex items-center gap-2 text-sm">
                    <Archive className="text-muted-foreground size-3" />
                    <span>Archived on {archiveDate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <div className="w-full md:w-2/3">
            <Tabs defaultValue="about" className="w-full">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="teams">Teams</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <Mail className="text-muted-foreground mt-0.5 size-5" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-muted-foreground text-sm">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Users className="text-muted-foreground mt-0.5 size-5" />
                        <div>
                          <p className="font-medium">Role</p>
                          <p className="text-muted-foreground text-sm capitalize">
                            {role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-muted-foreground mt-0.5">
                          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.119.119 0 0 0-.126.063c-.334.595-.642 1.37-.877 1.987-1.833-.278-3.642-.278-5.427 0-.235-.618-.547-1.393-.884-1.987a.119.119 0 0 0-.126-.063c-1.714.29-3.354.8-4.884 1.49a.11.11 0 0 0-.051.044C.334 9.058-.203 13.5.66 17.858a.124.124 0 0 0 .047.085c1.959 1.416 3.85 2.278 5.705 2.847a.12.12 0 0 0 .13-.043c.353-.475.667-.979.94-1.506a.117.117 0 0 0-.064-.164 14.656 14.656 0 0 1-2.067-.974.119.119 0 0 1-.012-.197c.14-.103.278-.21.412-.318a.116.116 0 0 1 .122-.017c6.119 2.75 12.768 2.75 18.824 0a.116.116 0 0 1 .123.017c.133.108.27.215.412.318a.119.119 0 0 1-.01.197 13.77 13.77 0 0 1-2.068.974.117.117 0 0 0-.063.164c.275.527.587 1.03.939 1.506a.12.12 0 0 0 .13.043c1.857-.569 3.748-1.43 5.706-2.847a.12.12 0 0 0 .047-.084c1.026-5.061-.196-9.462-2.074-13.322a.094.094 0 0 0-.051-.044"/>
                        </svg>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">Slack Integration</p>
                            <p className="text-muted-foreground text-sm">
                              {member.data.slackUsername ? `@${member.data.slackUsername}` : "Not connected"}
                            </p>
                          </div>
                          {isAdmin && !isArchived && (
                            <Popover
                              open={slackUsersPopoverOpen}
                              onOpenChange={setSlackUsersPopoverOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-2"
                                  disabled={isLoadingSlackUsers}
                                >
                                  {isLoadingSlackUsers ? (
                                    <span className="mr-1 animate-spin">⟳</span>
                                  ) : (
                                    <Edit className="mr-1 size-3" />
                                  )}
                                  Connect
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
                                        onSelect={() => updateSlackUsername(null)}
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
                                              !member.data.slackUsername
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
                                          onSelect={() => updateSlackUsername(slackUser.name)}
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
                                                slackUser.name === member.data.slackUsername
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
                          )}
                        </div>
                      </div>

                      {isArchived && (
                        <div className="flex items-start gap-2">
                          <Archive className="text-muted-foreground mt-0.5 size-5" />
                          <div>
                            <p className="font-medium">Archived</p>
                            <p className="text-muted-foreground text-sm">
                              {archiveDate}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground py-6 text-center">
                      <p>No recent activity to display</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="teams" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Memberships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamMemberships.map((teamMembership) => (
                      <div
                        key={teamMembership.id}
                        className="flex items-center gap-2"
                      >
                        <Users className="size-5" />
                        <span>{teamMembership.team.name}</span>
                      </div>
                    ))}
                    {teamMemberships.length === 0 && (
                      <div className="text-muted-foreground py-6 text-center">
                        <p>Not a member of any teams</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
