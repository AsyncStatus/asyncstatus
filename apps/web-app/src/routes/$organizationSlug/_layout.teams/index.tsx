import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
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
import { Layers, Plus, Search, Trash, Users } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CreateTeamForm } from "@/components/create-team-form";
import { deleteTeamMutationOptions, listTeamsQueryOptions } from "@/rpc/organization/teams";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/teams/")({
  component: TeamsListPage,
  pendingComponent: PendingComponent,
  loader: async ({ context: { queryClient }, params: { organizationSlug } }) => {
    queryClient.prefetchQuery(listTeamsQueryOptions(organizationSlug));
    queryClient.prefetchQuery(
      typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
    );
  },
});

function TeamsListPage() {
  const { organizationSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const teamList = useQuery(listTeamsQueryOptions(organizationSlug));
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );

  const deleteTeam = useMutation({
    ...deleteTeamMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listTeamsQueryOptions(organizationSlug).queryKey,
      });
      setTeamToDelete(null);
    },
  });

  const isAdmin =
    organization.data?.member.role === "admin" || organization.data?.member.role === "owner";

  // Filter teams based on search query
  const filteredTeams = teamList.data?.filter((team) =>
    team.name?.toLowerCase().includes(searchQuery.toLowerCase()),
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
                <BreadcrumbPage>Teams</BreadcrumbPage>
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
              placeholder="Search teams..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="size-4" />
                  <span className="sm:inline">Create Team</span>
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Team</DialogTitle>
                  <DialogDescription>Create a new team for your organization.</DialogDescription>
                </DialogHeader>

                <CreateTeamForm
                  organizationSlug={organizationSlug}
                  onSuccess={() => setCreateTeamDialogOpen(false)}
                  onCancel={() => setCreateTeamDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          <AlertDialog
            open={!!teamToDelete}
            onOpenChange={(open) => !open && setTeamToDelete(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the team
                  {teamToDelete &&
                    ` "${teamList.data?.find((team) => team.id === teamToDelete)?.name}"`}
                  and remove all member associations. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (teamToDelete) {
                      deleteTeam.mutate({
                        idOrSlug: organizationSlug,
                        teamId: teamToDelete,
                      });
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Team
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="py-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams?.length === 0 ? (
            <div className="text-muted-foreground col-span-full py-8 text-center">
              <Layers className="mx-auto mb-2 size-10 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No teams found</p>
              <p className="text-sm max-w-sm mx-auto">
                {searchQuery
                  ? "Try a different search query"
                  : "Create your first team to get started"}
              </p>
            </div>
          ) : (
            filteredTeams?.map((team) => (
              <Card key={team.id} className="overflow-hidden pb-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm sm:text-base font-medium">{team.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {team.teamMemberships?.length || 0} members
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="text-muted-foreground size-4" />
                      <span className="text-xs sm:text-sm">
                        {team.teamMemberships?.length || 0} members
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 flex gap-2 border-t pb-3">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm"
                  >
                    <Link
                      to="/$organizationSlug/teams/$teamId"
                      params={{ organizationSlug, teamId: team.id }}
                    >
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">Details</span>
                    </Link>
                  </Button>

                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteTeam.isPending}
                      onClick={() => setTeamToDelete(team.id)}
                      title="Delete Team"
                      className="flex-initial"
                    >
                      <Trash className="size-4" />
                    </Button>
                  )}
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
      </div>
    </div>
  );
}
