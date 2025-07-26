import { getFileContract } from "@asyncstatus/api/typed-handlers/file";
import {
  getMemberContract,
  listMembersContract,
  updateMemberContract,
} from "@asyncstatus/api/typed-handlers/member";
import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import { serializeFormData } from "@asyncstatus/typed-handlers";
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
import { Card, CardContent, CardHeader, CardTitle } from "@asyncstatus/ui/components/card";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { toast } from "@asyncstatus/ui/components/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@asyncstatus/ui/components/tabs";
import { Archive, Calendar, Copy, Mail, Trash, Users } from "@asyncstatus/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { sessionBetterAuthQueryOptions } from "@/better-auth-tanstack-query";
import { UpdateMemberFormDialog } from "@/components/update-member-form";
import { getInitials } from "@/lib/utils";
import { typedMutationOptions, typedQueryOptions, typedUrl } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/users/$userId")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { organizationSlug, userId } }) => {
    queryClient.prefetchQuery(
      typedQueryOptions(getMemberContract, {
        idOrSlug: organizationSlug,
        memberId: userId,
      }),
    );
    queryClient.prefetchQuery(
      typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
    );
  },
});

function RouteComponent() {
  const { organizationSlug, userId } = Route.useParams();
  const queryClient = useQueryClient();
  const member = useQuery(
    typedQueryOptions(getMemberContract, { idOrSlug: organizationSlug, memberId: userId }),
  );
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );
  const session = useQuery(sessionBetterAuthQueryOptions());
  const updateMember = useMutation({
    ...typedMutationOptions(updateMemberContract),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }).queryKey,
      });

      if (data.userId === session.data?.user.id) {
        queryClient.invalidateQueries({
          queryKey: typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug })
            .queryKey,
        });
        queryClient.setQueryData(sessionBetterAuthQueryOptions().queryKey, (sessionData) => {
          if (!sessionData) {
            return sessionData;
          }
          return {
            ...sessionData,
            user: { ...sessionData.user, ...data.user },
          };
        });
      }
    },
  });
  const isAdmin =
    organization.data.member.role === "admin" || organization.data.member.role === "owner";
  const { user, role, createdAt, teamMemberships, archivedAt } = member.data;
  const joinDate = createdAt ? format(new Date(createdAt), "PPP") : "N/A";
  const archiveDate = archivedAt ? format(new Date(archivedAt), "PPP") : null;
  const isArchived = Boolean(archivedAt);

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
                  <Link to="/$organizationSlug/users" params={{ organizationSlug }}>
                    Users
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/$organizationSlug/users/$userId" params={{ organizationSlug, userId }}>
                    {user.name}
                  </Link>
                </BreadcrumbLink>
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
                updateMember.mutate(
                  serializeFormData({
                    idOrSlug: organizationSlug,
                    memberId: member.data.id,
                    archivedAt: null,
                  }),
                );
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
                  idOrSlug: organizationSlug,
                  memberId: member.data.id,
                  archivedAt: new Date().toISOString(),
                  firstName: user.name,
                  lastName: user.name,
                  role: "member",
                });
              }}
              className="flex-initial"
              title={isArchived ? "Cannot remove archived user" : "Remove user"}
            >
              <Trash className="size-4" />
              <span>Remove</span>
            </Button>
          )}

          {isAdmin && (
            <UpdateMemberFormDialog
              organizationSlugOrId={organizationSlug}
              memberId={member.data.id}
            />
          )}
        </div>
      </header>

      <div className="container mx-auto space-y-8 py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* User Profile Card */}
          <Card className={`w-full md:w-1/3 ${isArchived ? "opacity-90" : ""}`}>
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar className={`mb-4 size-24 ${isArchived ? "grayscale" : ""}`}>
                <AvatarImage
                  src={
                    user.image
                      ? typedUrl(getFileContract, {
                          idOrSlug: organizationSlug,
                          fileKey: user.image,
                        })
                      : undefined
                  }
                  alt={user.name}
                />
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
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
                          <p className="text-muted-foreground text-sm">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Users className="text-muted-foreground mt-0.5 size-5" />
                        <div>
                          <p className="font-medium">Role</p>
                          <p className="text-muted-foreground text-sm capitalize">{role}</p>
                        </div>
                      </div>

                      {isArchived && (
                        <div className="flex items-start gap-2">
                          <Archive className="text-muted-foreground mt-0.5 size-5" />
                          <div>
                            <p className="font-medium">Archived</p>
                            <p className="text-muted-foreground text-sm">{archiveDate}</p>
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
                      <div key={teamMembership.id} className="flex items-center gap-2">
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
