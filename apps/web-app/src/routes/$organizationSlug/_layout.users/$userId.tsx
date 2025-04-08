import { Suspense, useState } from "react";
import {
  getActiveMemberQueryOptions,
  getMemberQueryOptions,
  listMembersQueryOptions,
  removeMemberMutationOptions,
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

import { authClient } from "@/lib/auth";
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
    ]);
  },
});

function RouteComponent() {
  const { organizationSlug, userId } = Route.useParams();
  const queryClient = useQueryClient();
  const [updateMemberDialogOpen, setUpdateMemberDialogOpen] = useState(false);
  const [member, activeMember] = useSuspenseQueries({
    queries: [
      getMemberQueryOptions({ idOrSlug: organizationSlug, memberId: userId }),
      getActiveMemberQueryOptions(),
    ],
  });
  const removeMember = useMutation({
    ...removeMemberMutationOptions(),
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
  const isAdmin = authClient.organization.checkRolePermission({
    role: "admin",
    permission: { member: ["create", "update", "delete"] },
  });
  const { user, role, createdAt, team } = member.data as any;
  const joinDate = createdAt ? format(new Date(createdAt), "PPP") : "N/A";

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
          {isAdmin && (
            <Button
              variant="destructive"
              disabled={removeMember.isPending}
              onClick={() => {
                if (activeMember.data.id === member.data.id) {
                  toast.info("You cannot remove your own account");
                  return;
                }

                removeMember.mutate({
                  memberIdOrEmail: member.data.id,
                });
              }}
              className="flex-initial"
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
                <Button variant="secondary">
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
          <Card className="w-full md:w-1/3">
            <CardContent className="flex flex-col items-center pt-6">
              <Avatar className="mb-4 size-24">
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
              <div className="mt-3">{getRoleBadge(role)}</div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Calendar className="text-muted-foreground size-3" />
                <span>Joined on {joinDate}</span>
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
                    {team ? (
                      <div className="flex items-center gap-2">
                        <Users className="size-5" />
                        <span>{team.name}</span>
                      </div>
                    ) : (
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
