import { useState } from "react";
import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import {
  deleteTeamMutationOptions,
  getTeamMembersQueryOptions,
  getTeamQueryOptions,
  removeTeamMemberMutationOptions,
} from "@/rpc/organization/teams";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@asyncstatus/ui/components/alert-dialog";
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
import {
  Calendar,
  Edit,
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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";

import { getFileUrl, getInitials, upperFirst } from "@/lib/utils";
import { AddTeamMemberForm } from "@/components/add-team-member-form";
import { UpdateTeamForm } from "@/components/update-team-form";

export const Route = createFileRoute(
  "/$organizationSlug/_layout/teams/$teamId",
)({
  component: TeamDetailsPage,
  pendingComponent: PendingComponent,
  loader: async ({
    context: { queryClient },
    params: { organizationSlug, teamId },
  }) => {
    await Promise.all([
      queryClient.ensureQueryData(
        getTeamQueryOptions(organizationSlug, teamId),
      ),
      queryClient.ensureQueryData(
        getTeamMembersQueryOptions(organizationSlug, teamId),
      ),
      queryClient.ensureQueryData(
        getOrganizationQueryOptions(organizationSlug),
      ),
    ]);
  },
});

function TeamDetailsPage() {
  const { organizationSlug, teamId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [team, teamMembers, organization] = useSuspenseQueries({
    queries: [
      getTeamQueryOptions(organizationSlug, teamId),
      getTeamMembersQueryOptions(organizationSlug, teamId),
      getOrganizationQueryOptions(organizationSlug),
    ],
  });

  const removeTeamMember = useMutation({
    ...removeTeamMemberMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getTeamMembersQueryOptions(organizationSlug, teamId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getTeamQueryOptions(organizationSlug, teamId).queryKey,
      });
    },
  });

  const deleteTeam = useMutation({
    ...deleteTeamMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["teams", organizationSlug],
      });
      // Navigate back to teams list after deletion
      navigate({
        to: "/$organizationSlug/teams",
        params: { organizationSlug },
      });
    },
  });

  const isAdmin =
    organization.data.member.role === "admin" ||
    organization.data.member.role === "owner";

  // Filter members based on search query
  const filteredMembers = teamMembers.data.filter(
    (membership) =>
      membership.member.user.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      membership.member.user.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

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
                    to="/$organizationSlug/teams"
                    params={{ organizationSlug }}
                  >
                    Teams
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{team.data.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              name="search"
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Dialog
              open={editTeamDialogOpen}
              onOpenChange={setEditTeamDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="size-4" />
                  Edit Team
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Team</DialogTitle>
                  <DialogDescription>
                    Update team name or other details.
                  </DialogDescription>
                </DialogHeader>

                <UpdateTeamForm
                  organizationSlug={organizationSlug}
                  teamId={teamId}
                  onSuccess={() => setEditTeamDialogOpen(false)}
                  onCancel={() => setEditTeamDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash className="size-4" />
                Delete Team
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the team &quot;{team.data.name}
                    &quot; and remove all member associations. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteTeam.mutate({
                        idOrSlug: organizationSlug,
                        teamId,
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isAdmin && (
            <Dialog
              open={addMemberDialogOpen}
              onOpenChange={setAddMemberDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Add Member
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>
                    Add an existing organization member to this team.
                  </DialogDescription>
                </DialogHeader>

                <AddTeamMemberForm
                  organizationSlug={organizationSlug}
                  teamId={teamId}
                  onSuccess={() => setAddMemberDialogOpen(false)}
                  onCancel={() => setAddMemberDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <div className="py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.length === 0 ? (
            <div className="text-muted-foreground col-span-full py-8 text-center">
              <Users className="mx-auto mb-2 size-10 opacity-50" />
              <p className="text-lg font-medium">No team members found</p>
              <p className="text-sm">
                {searchQuery
                  ? "Try a different search query"
                  : "Add members to this team to get started"}
              </p>
            </div>
          ) : (
            filteredMembers.map((membership) => (
              <Card key={membership.id} className="overflow-hidden pb-0">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage
                        src={
                          membership.member.user.image
                            ? getFileUrl({
                                param: { idOrSlug: organizationSlug },
                                query: {
                                  fileKey: membership.member.user.image,
                                },
                              })
                            : undefined
                        }
                      />
                      <AvatarFallback className="text-lg">
                        {getInitials(membership.member.user.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-medium">
                        {membership.member.user.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {membership.member.user.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {upperFirst(membership.member.role)}
                    </Badge>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Calendar className="size-3" />
                      <span>
                        Joined{" "}
                        {dayjs(membership.member.createdAt).format(
                          "MMM D, YYYY",
                        )}
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
                        params={{
                          organizationSlug,
                          userId: membership.member.id,
                        }}
                      >
                        <UserRound className="size-4" />
                        View Profile
                      </Link>
                    </Button>

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={removeTeamMember.isPending}
                        onClick={() => {
                          removeTeamMember.mutate({
                            idOrSlug: organizationSlug,
                            teamId,
                            memberId: membership.member.id,
                          });
                        }}
                        className="flex-initial"
                      >
                        <Trash className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
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
      </div>
    </div>
  );
}
