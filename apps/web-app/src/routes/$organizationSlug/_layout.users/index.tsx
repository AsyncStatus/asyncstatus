import { updateMemberContract } from "@asyncstatus/api/typed-handlers/member";
import { serializeFormData } from "@asyncstatus/typed-handlers";
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@asyncstatus/ui/components/breadcrumb";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@asyncstatus/ui/components/input";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@asyncstatus/ui/components/tabs";
import {
  Archive,
  Calendar,
  Copy,
  Mail,
  Search,
  Trash,
  UserPlus,
  UserRound,
  Users,
} from "@asyncstatus/ui/icons";
import { useMutation, useQueryClient, useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { useState } from "react";
import { InviteMemberForm } from "@/components/invite-member-form";
import { UpdateMemberFormDialog } from "@/components/update-member-form";
import { getFileUrl, getInitials, upperFirst } from "@/lib/utils";
import { listMembersQueryOptions } from "@/rpc/organization/member";
import {
  cancelInvitationMutationOptions,
  getOrganizationQueryOptions,
} from "@/rpc/organization/organization";
import { typedMutationOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/users/")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  loader: async ({ context: { queryClient }, params: { organizationSlug } }) => {
    await Promise.all([
      queryClient.ensureQueryData(listMembersQueryOptions(organizationSlug)),
      queryClient.ensureQueryData(getOrganizationQueryOptions(organizationSlug)),
    ]);
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<string>("members");
  const [organization, members] = useSuspenseQueries({
    queries: [
      getOrganizationQueryOptions(organizationSlug),
      listMembersQueryOptions(organizationSlug),
    ],
  });
  const updateMember = useMutation({
    ...typedMutationOptions(updateMemberContract),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(organizationSlug).queryKey,
      });
    },
  });
  const cancelInvitation = useMutation({
    ...cancelInvitationMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(organizationSlug).queryKey,
      });
    },
  });
  const isAdmin =
    organization.data.member.role === "admin" || organization.data.member.role === "owner";

  // Filter members based on archived status and search query
  const activeMembers = members.data.members?.filter(
    (member) =>
      !member?.archivedAt &&
      (member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const archivedMembers = members.data.members?.filter(
    (member) =>
      member?.archivedAt &&
      (member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredInvitations = members.data.invitations?.filter((invitation) =>
    invitation.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Function to render archive date
  const formatArchiveDate = (archivedAt: string | null) => {
    return archivedAt ? dayjs(archivedAt).format("MMM D, YYYY") : "Unknown";
  };

  return (
    <>
      <header className="flex flex-col gap-3 pb-4 sm:pb-0">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Mobile-optimized controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              name="search"
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Dialog open={inviteMemberDialogOpen} onOpenChange={setInviteMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <UserPlus className="size-4" />
                  <span className="sm:inline">Invite User</span>
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite User</DialogTitle>
                  <DialogDescription>
                    Invite a new user to join your organization.
                  </DialogDescription>
                </DialogHeader>

                <InviteMemberForm
                  organizationSlug={organizationSlug}
                  onSuccess={() => setInviteMemberDialogOpen(false)}
                  onCancel={() => setInviteMemberDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="py-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="size-3" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">All</span>
              <span className="text-muted-foreground/60 text-xs">{activeMembers?.length ?? 0}</span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Archive className="size-3" />
              <span className="hidden sm:inline">Archived</span>
              <span className="sm:hidden">Arch.</span>
              <span className="text-muted-foreground/60 text-xs">
                {archivedMembers?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="invitations"
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <Mail className="size-3" />
              <span className="hidden sm:inline">Invitations</span>
              <span className="sm:hidden">Inv.</span>
              <span className="text-muted-foreground/60 text-xs">
                {members.data.invitations?.length ?? 0}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeMembers?.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center">
                  <Users className="mx-auto mb-2 size-10 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No members found</p>
                  <p className="text-sm max-w-sm mx-auto">
                    {searchQuery ? "Try a different search query" : "Invite members to get started"}
                  </p>
                </div>
              ) : (
                activeMembers?.map((member) => {
                  return (
                    <Card key={member.id} className="overflow-hidden pb-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 sm:size-12">
                            <AvatarImage
                              src={
                                member.user.image
                                  ? getFileUrl({
                                      param: { idOrSlug: organizationSlug },
                                      query: { fileKey: member.user.image },
                                    })
                                  : undefined
                              }
                            />
                            <AvatarFallback className="text-sm sm:text-lg">
                              {getInitials(member.user.name ?? "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-base font-medium truncate">
                              {member.user.name}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate">
                              {member.user.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {upperFirst(member.role)}
                          </Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Calendar className="size-3" />
                            <span>Joined {dayjs(member.createdAt).format("MMM D, YYYY")}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pb-3">
                        <div className="flex w-full gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <Link
                              to="/$organizationSlug/users/$userId"
                              params={{ organizationSlug, userId: member.id }}
                            >
                              <UserRound className="size-4" />
                              <span className="hidden sm:inline">View Profile</span>
                              <span className="sm:hidden">Profile</span>
                            </Link>
                          </Button>

                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={updateMember.isPending}
                              onClick={() => {
                                updateMember.mutate(
                                  serializeFormData({
                                    idOrSlug: organizationSlug,
                                    memberId: member.id,
                                    archivedAt: new Date().toISOString(),
                                  }),
                                );
                              }}
                              title="Archive this user"
                              className="flex-initial"
                            >
                              <Archive className="size-4" />
                            </Button>
                          )}

                          {isAdmin && (
                            <UpdateMemberFormDialog
                              small
                              organizationSlugOrId={organizationSlug}
                              memberId={member.id}
                            />
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedMembers?.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center">
                  <Archive className="mx-auto mb-2 size-10 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No archived users found</p>
                  <p className="text-sm max-w-sm mx-auto">
                    {searchQuery ? "Try a different search query" : "There are no archived users"}
                  </p>
                </div>
              ) : (
                archivedMembers?.map((member) => {
                  return (
                    <Card key={member.id} className="overflow-hidden pb-0 opacity-90">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 sm:size-12 grayscale">
                            <AvatarImage
                              src={
                                member.user.image
                                  ? getFileUrl({
                                      param: { idOrSlug: organizationSlug },
                                      query: { fileKey: member.user.image },
                                    })
                                  : undefined
                              }
                            />
                            <AvatarFallback className="text-sm sm:text-lg">
                              {getInitials(member.user.name ?? "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-base font-medium truncate">
                              {member.user.name}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate">
                              {member.user.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {upperFirst(member.role)}
                          </Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Archive className="size-3" />
                            <span>Archived {formatArchiveDate(member?.archivedAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pb-3">
                        <div className="flex w-full gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <Link
                              to="/$organizationSlug/users/$userId"
                              params={{ organizationSlug, userId: member.id }}
                            >
                              <UserRound className="size-4" />
                              <span className="hidden sm:inline">View Profile</span>
                              <span className="sm:hidden">Profile</span>
                            </Link>
                          </Button>

                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateMember.isPending}
                              onClick={() => {
                                updateMember.mutate(
                                  serializeFormData({
                                    idOrSlug: organizationSlug,
                                    memberId: member.id,
                                    archivedAt: null,
                                  }),
                                  {
                                    onSuccess: () => {
                                      // Switch to members tab after unarchiving
                                      setTab("members");
                                    },
                                  },
                                );
                              }}
                              title="Restore this user to active status"
                              className="flex-initial"
                            >
                              <Archive className="size-4" />
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="pt-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInvitations?.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center">
                  <Mail className="mx-auto mb-2 size-10 opacity-50" />
                  <p className="text-base sm:text-lg font-medium">No invitations found</p>
                  <p className="text-sm max-w-sm mx-auto">
                    {searchQuery
                      ? "Try a different search query"
                      : "All invitations have been accepted or expired"}
                  </p>
                </div>
              ) : (
                filteredInvitations?.map((invitation) => {
                  return (
                    <Card key={invitation.id} className="overflow-hidden pb-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 sm:size-12">
                            <AvatarFallback className="text-sm sm:text-lg">
                              {getInitials(invitation.email.split("@")[0] ?? "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm sm:text-base font-medium truncate">
                              {invitation.name}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm truncate">
                              {invitation.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {upperFirst(invitation.role)}
                          </Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Calendar className="size-3" />
                            <span>Invited {dayjs(invitation.createdAt).format("MMM D, YYYY")}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pb-3">
                        <div className="flex w-full gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast.promise(
                                navigator.clipboard.writeText(invitation.invitationLink),
                                {
                                  loading: "Copying invitation link...",
                                  success: "Invitation link copied!",
                                  error: "Failed to copy link",
                                },
                              );
                            }}
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <Copy className="size-4" />
                            <span className="hidden sm:inline">Copy Link</span>
                            <span className="sm:hidden">Copy</span>
                          </Button>

                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={cancelInvitation.isPending}
                              onClick={() => {
                                cancelInvitation.mutate({
                                  param: {
                                    idOrSlug: organizationSlug,
                                    invitationId: invitation.id,
                                  },
                                });
                              }}
                              title="Cancel invitation"
                              className="flex-initial"
                            >
                              <Trash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function PendingComponent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-full sm:w-48" />
          <Skeleton className="h-9 w-full sm:w-28" />
        </div>
      </div>
      <Skeleton className="h-8 w-56" />

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    </div>
  );
}
