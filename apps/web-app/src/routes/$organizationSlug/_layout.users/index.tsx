import { useState } from "react";
import {
  cancelInvitationMutationOptions,
  getActiveMemberQueryOptions,
  listMembersQueryOptions,
  removeMemberMutationOptions,
} from "@/rpc/organization";
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
import { toast } from "@asyncstatus/ui/components/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@asyncstatus/ui/components/tabs";
import {
  Calendar,
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

import { authClient } from "@/lib/auth";
import { getInitials, upperFirst } from "@/lib/utils";
import { InviteMemberForm } from "@/components/invite-member-form";

export const Route = createFileRoute("/$organizationSlug/_layout/users/")({
  component: RouteComponent,
  loader: async ({
    context: { queryClient },
    params: { organizationSlug },
  }) => {
    await Promise.all([
      queryClient.ensureQueryData(listMembersQueryOptions(organizationSlug)),
      queryClient.ensureQueryData(getActiveMemberQueryOptions()),
    ]);
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMember, members] = useSuspenseQueries({
    queries: [
      getActiveMemberQueryOptions(),
      listMembersQueryOptions(organizationSlug),
    ],
  });
  const removeMember = useMutation({
    ...removeMemberMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(organizationSlug).queryKey,
      });
      toast.success("Member removed successfully");
    },
  });
  const cancelInvitation = useMutation({
    ...cancelInvitationMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listMembersQueryOptions(organizationSlug).queryKey,
      });
      toast.success("Invitation cancelled successfully");
    },
  });
  const isAdmin = authClient.organization.checkRolePermission({
    role: "admin",
    permission: { member: ["create", "update", "delete"] },
  });
  const canCancelInvitation = authClient.organization.checkRolePermission({
    role: "admin",
    permission: { invitation: ["cancel"] },
  });

  // Filter members and invitations based on search query
  const filteredMembers = members.data.members?.filter(
    (member) =>
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredInvitations = members.data.invitations?.filter((invitation) =>
    invitation.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header className="flex shrink-0 items-center justify-between gap-2 pb-2">
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
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
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
                  <Plus className="mr-1 h-4 w-4" />
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
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="py-4">
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-1">
              <Users className="size-4" />
              Members ({members.data.members?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="invitations"
              className="flex items-center gap-1"
            >
              <Mail className="size-4" />
              Invitations ({members.data.invitations?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers?.length === 0 ? (
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
                filteredMembers?.map((member) => (
                  <Card key={member.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-12">
                          <AvatarImage src={member.user.image ?? undefined} />
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
                    <CardContent className="pt-0 pb-2">
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
                    <CardFooter className="bg-muted/20 border-t pt-3">
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
                            <UserRound className="mr-1 h-4 w-4" />
                            View Profile
                          </Link>
                        </Button>

                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={
                              removeMember.isPending ||
                              activeMember.data?.data?.id === member.id
                            }
                            onClick={() => {
                              if (activeMember.data?.data?.id === member.id) {
                                toast.info(
                                  "You cannot remove your own account",
                                );
                                return;
                              }

                              removeMember.mutate({
                                memberIdOrEmail: member.id,
                              });
                            }}
                            className="flex-initial"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
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
                filteredInvitations?.map((invitation) => (
                  <Card key={invitation.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="bg-primary/10 text-primary size-12">
                          <AvatarFallback className="text-lg">
                            {getInitials(invitation.email.split("@")[0] ?? "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="font-medium">
                            {invitation.email}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge variant="outline">
                              {upperFirst(invitation.status)}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {upperFirst(invitation.role ?? "member")}
                        </Badge>
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Calendar className="size-3" />
                          <span>
                            Expires{" "}
                            {dayjs(invitation.expiresAt).format("MMM D, YYYY")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t pt-3">
                      {canCancelInvitation && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={cancelInvitation.isPending}
                          onClick={() => {
                            cancelInvitation.mutate({
                              invitationId: invitation.id,
                            });
                          }}
                          className="w-full"
                        >
                          <Trash className="mr-1 h-4 w-4" />
                          Cancel Invitation
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
