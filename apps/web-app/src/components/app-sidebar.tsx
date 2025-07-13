import { listUserInvitationsContract } from "@asyncstatus/api/typed-handlers/invitation";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { toast } from "@asyncstatus/ui/components/sonner";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { LifeBuoy, Send, Settings, Sun, Users } from "lucide-react";
import { Suspense } from "react";
import {
  sendVerificationEmailMutationOptions,
  sessionBetterAuthQueryOptions,
} from "@/better-auth-tanstack-query";
import { typedQueryOptions } from "@/typed-handlers";
import { OrganizationMenu, OrganizationMenuSkeleton } from "./organization-menu";
import { UserMenu, UserMenuSkeleton } from "./user-menu";

function AppSidebarLinks(props: { organizationSlug: string }) {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug: props.organizationSlug }}>
            <Sun />
            <span>Status updates</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to={"/$organizationSlug/users"}
            params={{ organizationSlug: props.organizationSlug }}
          >
            <Users />
            <span>Users</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to={"/$organizationSlug/settings"}
            params={{ organizationSlug: props.organizationSlug }}
          >
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

function AppSidebarBetaNotice() {
  return (
    <Card className="p-2">
      <CardHeader className="px-0">
        <CardTitle className="text-md">We&apos;re in beta</CardTitle>
        <CardDescription className="text-xs text-pretty">
          We&apos;re working hard to bring you the best experience but there are some features that
          are still under development or might not work as expected.
        </CardDescription>
      </CardHeader>
      <CardFooter className="px-0">
        <div className="flex w-full flex-col items-center gap-2">
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            <a href="mailto:support@asyncstatus.com" target="_blank" rel="noreferrer">
              <LifeBuoy className="size-3" />
              <span>Report an issue</span>
            </a>
          </Button>
          <Button size="sm" className="w-full text-xs" asChild>
            <a href="mailto:kacper@asyncstatus.com" target="_blank" rel="noreferrer">
              <Send className="size-3" />
              <span>Give feedback</span>
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function AppSidebarInvitations() {
  const invitations = useSuspenseQuery(typedQueryOptions(listUserInvitationsContract, {}));

  if (invitations.data.length === 0) {
    return null;
  }

  return (
    <Card className="p-2">
      <CardHeader className="px-0">
        <CardTitle className="text-md text-pretty">Pending invitations</CardTitle>
        <CardDescription className="text-xs text-pretty">
          You have {invitations.data.length} pending invitation
          {invitations.data.length === 1 ? "" : "s"}. You can accept or reject them from the
          invitations page.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex w-full flex-col items-center gap-2">
          <Button size="sm" className="w-full text-xs" asChild>
            <Link to="/invitations">See invitations</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppSidebarTeams(props: { organizationSlug: string }) {
  const teams = useSuspenseQuery(
    typedQueryOptions(listTeamsContract, {
      idOrSlug: props.organizationSlug,
    }),
  );
  return teams.data.map((team) => (
    <SidebarMenuItem key={team.id}>
      <SidebarMenuButton asChild>
        <Link
          to="/$organizationSlug/teams/$teamId"
          params={{ organizationSlug: props.organizationSlug, teamId: team.id }}
        >
          {team.name}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}

function AppSidebarTeamsSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1">
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  );
}

function AppSidebarUserEmailNotVerified() {
  const session = useSuspenseQuery(sessionBetterAuthQueryOptions());
  const sendVerificationEmail = useMutation({
    ...sendVerificationEmailMutationOptions(),
    onSuccess() {
      toast.success("We've sent you a verification link, please check your email.");
    },
  });

  if (session.data?.user.emailVerified) {
    return null;
  }

  return (
    <Card className="p-2">
      <CardHeader className="px-0">
        <CardTitle className="text-md">Email not verified</CardTitle>
        <CardDescription className="text-xs text-pretty">
          Your email is not verified. Please verify your email to unlock all features.
        </CardDescription>
      </CardHeader>
      <CardFooter className="px-0">
        <div className="flex w-full flex-col items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              if (!session.data) {
                toast.error("You are not logged in");
                return;
              }
              sendVerificationEmail.mutate({
                email: session.data.user.email,
                callbackURL: import.meta.env.VITE_WEB_APP_URL,
              });
            }}
          >
            <Send className="size-3" />
            <span>Send verification email</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function AppSidebar(props: { organizationSlug: string }) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Suspense fallback={<OrganizationMenuSkeleton />}>
          <OrganizationMenu organizationSlug={props.organizationSlug} />
        </Suspense>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <AppSidebarLinks organizationSlug={props.organizationSlug} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <Link
              to="/$organizationSlug/teams"
              params={{ organizationSlug: props.organizationSlug }}
            >
              Your teams
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Suspense fallback={<AppSidebarTeamsSkeleton />}>
                <AppSidebarTeams organizationSlug={props.organizationSlug} />
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0 max-sm:p-2">
        <Suspense fallback={null}>
          <AppSidebarUserEmailNotVerified />
        </Suspense>

        <Suspense fallback={null}>
          <AppSidebarInvitations />
        </Suspense>

        <AppSidebarBetaNotice />

        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu organizationSlug={props.organizationSlug} />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebarSkeleton() {
  const params = useParams({
    from: "/$organizationSlug",
    shouldThrow: false,
  });

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <Suspense fallback={<OrganizationMenuSkeleton />}>
            <OrganizationMenuSkeleton />
          </Suspense>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Organization</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <AppSidebarLinks organizationSlug={params?.organizationSlug ?? ""} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Your teams</SidebarGroupLabel>
            <SidebarGroupContent>
              <AppSidebarTeamsSkeleton />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-0 max-sm:p-2">
          <AppSidebarBetaNotice />

          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu organizationSlug={params?.organizationSlug ?? ""} />
          </Suspense>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="gap-4 px-4 py-2.5">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
