import { Suspense, useState } from "react";
import {
  listMembersQueryOptions,
  updateMemberMutationOptions,
} from "@/rpc/organization/member";
import {
  cancelInvitationMutationOptions,
  getOrganizationQueryOptions,
} from "@/rpc/organization/organization";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@asyncstatus/ui/components/tabs";
import {
  Archive,
  Calendar,
  Edit,
  Mail,
  Plus,
  Search,
  Trash,
  UserRound,
  Users,
} from "@asyncstatus/ui/icons";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import { getFileUrl, getInitials, upperFirst } from "@/lib/utils";
import { InviteMemberForm } from "@/components/invite-member-form";
import { UpdateMemberForm } from "@/components/update-member-form";

export const Route = createFileRoute("/$organizationSlug/_layout/users/")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  loader: async ({
    context: { queryClient },
    params: { organizationSlug },
  }) => {
    await Promise.all([
      queryClient.ensureQueryData(listMembersQueryOptions(organizationSlug)),
      queryClient.ensureQueryData(
        getOrganizationQueryOptions(organizationSlug),
      ),
    ]);
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [updateMemberDialogOpen, setUpdateMemberDialogOpen] = useState(false);
  const [updateMemberId, setUpdateMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<string>("members");
  const [organization, members] = useSuspenseQueries({
    queries: [
      getOrganizationQueryOptions(organizationSlug),
      listMembersQueryOptions(organizationSlug),
    ],
  });
  const updateMember = useMutation({
    ...updateMemberMutationOptions(),
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
    organization.data.member.role === "admin" ||
    organization.data.member.role === "owner";

  // Filter members based on archived status and search query
  const activeMembers = members.data.members?.filter(
    (member) =>
      !member.archivedAt &&
      (member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const archivedMembers = members.data.members?.filter(
    (member) =>
      member.archivedAt &&
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
      <header className="flex shrink-0 items-center justify-between gap-2">
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

        <div className="flex gap-2">
          <div className="relative">
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
            <Dialog
              open={inviteMemberDialogOpen}
              onOpenChange={setInviteMemberDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Invite user
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite user</DialogTitle>
                  <DialogDescription>
                    Invite a user to your organization.
                  </DialogDescription>
                </DialogHeader>

                <InviteMemberForm
                  organizationSlug={organizationSlug}
                  onSuccess={() => {
                    setInviteMemberDialogOpen(false);
                    setTab("invitations");
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="py-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger value="members">
              <Users className="size-3" />
              <span>Users</span>
              <span className="text-muted-foreground/60 text-xs">
                {activeMembers?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="size-3" />
              <span>Archived</span>
              <span className="text-muted-foreground/60 text-xs">
                {archivedMembers?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <Mail className="size-3" />
              <span>Invitations</span>
              <span className="text-muted-foreground/60 text-xs">
                {members.data.invitations?.length ?? 0}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMembers?.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center">
                  <Users className="mx-auto mb-2 size-10 opacity-50" />
                  <p className="text-lg font-medium">No members found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? "Try a different search query"
                      : "Invite members to get started"}
                  </p>
                </div>
              ) : (
                activeMembers?.map((member) => {
                  return (
                    <Card key={member.id} className="overflow-hidden pb-0">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
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
                            <AvatarFallback className="text-lg">
                              {getInitials(member.user.name ?? "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="font-medium">
                              {member.user.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {member.user.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {upperFirst(member.role)}
                          </Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Calendar className="size-3" />
                            <span>
                              Joined{" "}
                              {dayjs(member.createdAt).format("MMM D, YYYY")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pb-3.5">
                        <div className="flex w-full gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                          >
                            <Link
                              to="/$organizationSlug/users/$userId"
                              params={{ organizationSlug, userId: member.id }}
                            >
                              <UserRound className="size-4" />
                              View Profile
                            </Link>
                          </Button>

                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={updateMember.isPending}
                              onClick={() => {
                                if (organization.data.member.id === member.id) {
                                  toast.info(
                                    "You cannot remove your own account",
                                  );
                                  return;
                                }

                                updateMember.mutate(
                                  {
                                    param: {
                                      idOrSlug: organizationSlug,
                                      memberId: member.id,
                                    },
                                    form: {
                                      archivedAt: new Date().toISOString(),
                                    },
                                  },
                                  {
                                    onSuccess: () => {
                                      setTab("archived");
                                    },
                                  },
                                );
                              }}
                              className="flex-initial"
                            >
                              <Trash className="size-4" />
                            </Button>
                          )}

                          {isAdmin && (
                            <Dialog
                              open={
                                updateMemberId === member.id &&
                                updateMemberDialogOpen
                              }
                              onOpenChange={(open) => {
                                setUpdateMemberDialogOpen(open);
                                if (!open) {
                                  setUpdateMemberId(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setUpdateMemberId(member.id);
                                    setUpdateMemberDialogOpen(true);
                                  }}
                                >
                                  <Edit className="size-4" />
                                  <span className="sr-only">Edit user</span>
                                </Button>
                              </DialogTrigger>

                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update user</DialogTitle>
                                  <DialogDescription>
                                    Update user&apos;s role or other details.
                                  </DialogDescription>
                                </DialogHeader>

                                <Suspense
                                  fallback={<Skeleton className="h-[322px]" />}
                                >
                                  <UpdateMemberForm
                                    organizationSlug={organizationSlug}
                                    memberId={member.id}
                                    onSuccess={() => {
                                      setUpdateMemberDialogOpen(false);
                                      setUpdateMemberId(null);
                                    }}
                                  />
                                </Suspense>
                              </DialogContent>
                            </Dialog>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedMembers?.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center">
                  <Archive className="mx-auto mb-2 size-10 opacity-50" />
                  <p className="text-lg font-medium">No archived users found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? "Try a different search query"
                      : "There are no archived users"}
                  </p>
                </div>
              ) : (
                archivedMembers?.map((member) => {
                  return (
                    <Card
                      key={member.id}
                      className="overflow-hidden pb-0 opacity-90"
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12 grayscale">
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
                            <AvatarFallback className="text-lg">
                              {getInitials(member.user.name ?? "")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="font-medium">
                              {member.user.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {member.user.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {upperFirst(member.role)}
                          </Badge>
                          <Badge variant="destructive">Archived</Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Archive className="size-3" />
                            <span>
                              Archived {formatArchiveDate(member.archivedAt)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pb-3.5">
                        <div className="flex w-full gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="flex-1"
                          >
                            <Link
                              to="/$organizationSlug/users/$userId"
                              params={{ organizationSlug, userId: member.id }}
                            >
                              <UserRound className="size-4" />
                              View Profile
                            </Link>
                          </Button>

                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateMember.isPending}
                              onClick={() => {
                                updateMember.mutate(
                                  {
                                    param: {
                                      idOrSlug: organizationSlug,
                                      memberId: member.id,
                                    },
                                    form: { archivedAt: null as any },
                                  },
                                  {
                                    onSuccess: () => {
                                      // Switch to members tab after unarchiving
                                      setTab("members");
                                    },
                                  },
                                );
                              }}
                              title="Restore this user to active status"
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredInvitations?.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center">
                  <Mail className="mx-auto mb-2 size-10 opacity-50" />
                  <p className="text-lg font-medium">No invitations found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? "Try a different search query"
                      : "All invitations have been accepted or expired"}
                  </p>
                </div>
              ) : (
                filteredInvitations?.map((invitation) => {
                  return (
                    <Card key={invitation.id} className="overflow-hidden pb-0">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-12">
                            <AvatarFallback className="text-lg">
                              {getInitials(
                                invitation.email.split("@")[0] ?? "",
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="font-medium">
                              {invitation.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {invitation.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {upperFirst(invitation.role ?? "member")}
                          </Badge>
                          <Badge
                            variant={
                              invitation.status === "rejected"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {upperFirst(invitation.status)}
                          </Badge>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Calendar className="size-3" />
                            <span>
                              Expires{" "}
                              {dayjs(invitation.expiresAt).format(
                                "MMMM DD, YYYY",
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-muted/20 border-t pb-3.5">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={cancelInvitation.isPending}
                            onClick={() => {
                              cancelInvitation.mutate({ id: invitation.id });
                            }}
                            className="w-full"
                          >
                            <Trash className="size-4" />
                            Remove Invitation
                          </Button>
                        )}
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
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-49" />
          <Skeleton className="h-10 w-29" />
        </div>
      </div>
      <Skeleton className="h-8 w-56" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
