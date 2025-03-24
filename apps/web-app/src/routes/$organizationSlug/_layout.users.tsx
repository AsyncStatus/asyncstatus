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
import { toast } from "@asyncstatus/ui/components/sonner";
import { Pencil, Plus, Trash, UserRound } from "@asyncstatus/ui/icons";
import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";

import { authClient } from "@/lib/auth";
import { getInitials, upperFirst } from "@/lib/utils";
import { InviteMemberForm } from "@/components/invite-member-form";

export const Route = createFileRoute("/$organizationSlug/_layout/users")({
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
  const isAdmin = authClient.organization.checkRolePermission({
    role: "admin",
    permission: { member: ["create", "update", "delete"] },
  });
  const canCancelInvitation = authClient.organization.checkRolePermission({
    role: "admin",
    permission: { invitation: ["cancel"] },
  });

  return (
    <>
      <header className="flex shrink-0 items-center gap-2 pb-4">
        <div className="flex w-full items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Users</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {isAdmin && (
            <Dialog
              open={inviteMemberDialogOpen}
              onOpenChange={setInviteMemberDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="ml-auto">
                  <Plus className="h-4 w-4" />
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.data.invitations?.map((invitation) => (
          <Card key={invitation.id} className="gap-0 p-2">
            <CardHeader className="p-2">
              <CardTitle className="flex flex-wrap items-center gap-2 p-0 font-normal">
                <p className="text-lg font-normal">{invitation.email}</p>
                <Badge variant="secondary">
                  {upperFirst(invitation.role ?? "member")}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <p>
                  Expires {dayjs(invitation.expiresAt).format("DD/MM/YYYY")}
                </p>
                <Badge variant="secondary">
                  {upperFirst(invitation.status)}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 p-2">
              {canCancelInvitation && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancelInvitation.isPending}
                  onClick={() => {
                    cancelInvitation.mutate({ invitationId: invitation.id });
                  }}
                >
                  <Trash className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {members.data.members?.map((member) => (
          <Card key={member.id} className="gap-0 p-2">
            <CardHeader className="p-2">
              <CardTitle className="flex items-center gap-2 p-0 font-normal">
                <Avatar>
                  <AvatarImage src={member.user.image ?? undefined} />
                  <AvatarFallback>
                    {getInitials(member.user.name ?? "")}
                  </AvatarFallback>
                </Avatar>
                <p className="text-lg font-normal">{member.user.name}</p>
                <Badge variant="secondary">{upperFirst(member.role)}</Badge>
              </CardTitle>
              <CardDescription>{member.user.email}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 p-2">
              <Button size="sm" variant="secondary">
                <UserRound className="h-4 w-4" />
                View profile
              </Button>
              {isAdmin && (
                <Button size="sm" variant="secondary">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {isAdmin && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={removeMember.isPending}
                  onClick={() => {
                    if (activeMember.data?.data?.id === member.id) {
                      toast.info("You cannot remove your own account");
                      return;
                    }

                    removeMember.mutate({ memberIdOrEmail: member.id });
                  }}
                >
                  <Trash className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
