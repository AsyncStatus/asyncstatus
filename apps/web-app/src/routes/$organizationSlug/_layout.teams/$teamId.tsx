import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import {
  deleteTeamContract,
  deleteTeamMemberContract,
  getTeamContract,
  getTeamMembersContract,
  listTeamsContract,
} from "@asyncstatus/api/typed-handlers/team";
import { dayjs } from "@asyncstatus/dayjs";
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
import { Avatar, AvatarFallback, AvatarImage } from "@asyncstatus/ui/components/avatar";
import { Badge } from "@asyncstatus/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
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
import { Calendar, Edit, Plus, Search, Trash, UserRound, Users } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AddTeamMemberForm } from "@/components/add-team-member-form";
import { UpdateTeamForm } from "@/components/update-team-form";
import { getInitials, upperFirst } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/teams/$teamId")({
  component: TeamDetailsPage,
  pendingComponent: PendingComponent,
  loader: async ({ context: { queryClient }, params: { organizationSlug, teamId } }) => {
    queryClient.prefetchQuery(
      typedQueryOptions(getTeamContract, { idOrSlug: organizationSlug, teamId }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(getTeamMembersContract, { idOrSlug: organizationSlug, teamId }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
    );
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

  const team = useQuery(typedQueryOptions(getTeamContract, { idOrSlug: organizationSlug, teamId }));
  const teamMembers = useQuery(
    typedQueryOptions(getTeamMembersContract, { idOrSlug: organizationSlug, teamId }),
  );
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );

  const deleteTeamMember = useMutation(
    typedMutationOptions(deleteTeamMemberContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getTeamMembersContract, {
            idOrSlug: organizationSlug,
            teamId,
          }).queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getTeamContract, { idOrSlug: organizationSlug, teamId })
            .queryKey,
        });
      },
    }),
  );

  const deleteTeam = useMutation(
    typedMutationOptions(deleteTeamContract, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }).queryKey,
        });
        navigate({
          to: "/$organizationSlug/teams",
          params: { organizationSlug },
        });
      },
    }),
  );

  const isAdmin =
    organization.data.member.role === "admin" || organization.data.member.role === "owner";

  // Filter members based on search query
  const filteredMembers = teamMembers.data?.filter(
    (membership) =>
      membership.member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membership.member.user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <header className="flex flex-col gap-3 pb-4 sm:pb-0">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/$organizationSlug/teams" params={{ organizationSlug }}>
                    Teams
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/$organizationSlug/teams/$teamId" params={{ organizationSlug, teamId }}>
                    {team.data?.name}
                  </Link>
                </BreadcrumbLink>
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
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isAdmin && (
              <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Edit className="size-4" />
                    <span className="sm:inline">Edit</span>
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit team</DialogTitle>
                    <DialogDescription>Update team name or other details.</DialogDescription>
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
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="size-4" />
                  <span className="sm:inline">Delete</span>
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the team &quot;{team.data?.name}
                      &quot; and remove all member associations. This action cannot be undone.
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
                      Delete team
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {isAdmin && (
              <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="size-4" />
                    <span className="sm:inline">Add member</span>
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add team member</DialogTitle>
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
        </div>
      </header>

      <div className="py-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers?.length === 0 ? (
            <div className="text-muted-foreground col-span-full py-8 text-center">
              <Users className="mx-auto mb-2 size-10 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No team members found</p>
              <p className="text-sm max-w-sm mx-auto">
                {searchQuery
                  ? "Try a different search query"
                  : "Add members to this team to get started"}
              </p>
            </div>
          ) : (
            filteredMembers?.map((membership) => (
              <Card key={membership.id} className="overflow-hidden pb-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 sm:size-12">
                      <AvatarImage
                        src={
                          membership.member.user.image
                            ? typedUrl(getFileContract, {
                                idOrSlug: organizationSlug,
                                fileKey: membership.member.user.image,
                              })
                            : undefined
                        }
                      />
                      <AvatarFallback className="text-sm sm:text-lg">
                        {getInitials(membership.member.user.name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-base font-medium truncate">
                        {membership.member.user.name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm truncate">
                        {membership.member.user.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {upperFirst(membership.member.role)}
                    </Badge>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Calendar className="size-3" />
                      <span>Joined {dayjs(membership.member.createdAt).format("MMM D, YYYY")}</span>
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
                        params={{
                          organizationSlug,
                          userId: membership.member.id,
                        }}
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
                        disabled={deleteTeamMember.isPending}
                        onClick={() => {
                          deleteTeamMember.mutate({
                            idOrSlug: organizationSlug,
                            teamId,
                            memberId: membership.member.id,
                          });
                        }}
                        className="flex-initial"
                        title="Remove from team"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-36" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
      </div>
    </div>
  );
}
