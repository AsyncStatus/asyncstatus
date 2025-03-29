import { getMemberQueryOptions } from "@/rpc/organization";
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
  Copy,
  Mail,
  MapPin,
  Phone,
  Users,
} from "@asyncstatus/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";

import { getInitials } from "@/lib/utils";

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
  const member = useSuspenseQuery(
    getMemberQueryOptions({ idOrSlug: organizationSlug, memberId: userId }),
  );

  const { user, role, createdAt, team } = member.data;
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
    <div className="space-y-6">
      <header className="flex shrink-0 items-center gap-2 pb-2">
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
                      ? `https://cdn.asyncstatus.com/${user.image}`
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

                      <div className="flex items-start gap-2">
                        <MapPin className="text-muted-foreground mt-0.5 size-5" />
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-muted-foreground text-sm">
                            Not specified
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Phone className="text-muted-foreground mt-0.5 size-5" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-muted-foreground text-sm">
                            Not specified
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
    </div>
  );
}
