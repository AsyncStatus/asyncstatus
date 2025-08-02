import { listUserInvitationsContract } from "@asyncstatus/api/typed-handlers/invitation";
import { getSubscriptionContract } from "@asyncstatus/api/typed-handlers/stripe";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { dayjs } from "@asyncstatus/dayjs";
import { Badge } from "@asyncstatus/ui/components/badge";
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
import { Progress } from "@asyncstatus/ui/components/progress";
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
import { Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import {
  CalendarDays,
  Crown,
  LifeBuoy,
  Plug,
  Plus,
  Send,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { Suspense, useState } from "react";
import {
  sendVerificationEmailMutationOptions,
  sessionBetterAuthQueryOptions,
} from "@/better-auth-tanstack-query";
import { typedQueryOptions } from "@/typed-handlers";
import { CreateTeamForm } from "./create-team-form";
import { OrganizationMenu, OrganizationMenuSkeleton } from "./organization-menu";
import { UserMenu, UserMenuSkeleton } from "./user-menu";

function AppSidebarLinks(props: { organizationSlug: string }) {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/$organizationSlug" params={{ organizationSlug: props.organizationSlug }}>
            <Sun />
            <span className="pt-px">Status updates</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to={"/$organizationSlug/schedules"}
            params={{ organizationSlug: props.organizationSlug }}
          >
            <CalendarDays />
            <span className="pt-px">Schedules</span>
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
            <span className="pt-px">Users</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to={"/$organizationSlug/integrations"}
            params={{ organizationSlug: props.organizationSlug }}
          >
            <Plug />
            <span className="pt-px">Integrations</span>
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
            <span className="pt-px">Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

function AppSidebarBetaNotice() {
  return (
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
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const teams = useSuspenseQuery(
    typedQueryOptions(listTeamsContract, {
      idOrSlug: props.organizationSlug,
    }),
  );
  if (teams.data.length === 0) {
    return (
      <Dialog open={isCreateTeamModalOpen} onOpenChange={setIsCreateTeamModalOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-left text-muted-foreground justify-start"
          >
            <Plus className="size-3" />
            <span>Create team</span>
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
            <DialogDescription>Create a new team for your organization.</DialogDescription>
          </DialogHeader>

          <CreateTeamForm
            organizationSlug={props.organizationSlug}
            onSuccess={() => setIsCreateTeamModalOpen(false)}
            onCancel={() => setIsCreateTeamModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

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

function AppSidebarPlanUsage(props: { organizationSlug: string }) {
  const navigate = useNavigate();
  const subscription = useSuspenseQuery(
    typedQueryOptions(getSubscriptionContract, { idOrSlug: props.organizationSlug }),
  );

  // Don't show if no subscription data
  if (!subscription.data) {
    return null;
  }

  const isCustomTrial =
    subscription.data.customTrial && subscription.data.customTrial.status === "active";
  const isActive =
    subscription.data.status === "active" ||
    subscription.data.status === "trialing" ||
    isCustomTrial;

  if (!isActive) {
    return null;
  }

  const planName =
    isCustomTrial && subscription.data.customTrial
      ? subscription.data.customTrial.plan
      : subscription.data.planName;
  const endDate =
    isCustomTrial && subscription.data.customTrial
      ? new Date(subscription.data.customTrial.endDate * 1000)
      : subscription.data.currentPeriodEnd
        ? new Date(subscription.data.currentPeriodEnd * 1000)
        : null;

  const isTrialEnding =
    isCustomTrial && endDate && endDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000; // 3 days

  const usage = subscription.data.usage;
  const usagePercentage = usage
    ? Math.round((usage.currentMonth.used / usage.currentMonth.limit) * 100)
    : 0;

  return (
    <Card className="p-2 gap-0">
      <CardHeader className="px-0 gap-0">
        <CardTitle
          className="text-md flex items-center gap-2 cursor-pointer"
          onClick={() => {
            navigate({
              to: "/$organizationSlug/billing",
              params: { organizationSlug: props.organizationSlug },
            });
          }}
        >
          {planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : "Unknown"}
          {isCustomTrial && <Badge variant="secondary">Trial</Badge>}
        </CardTitle>
        {isCustomTrial && (
          <CardDescription className="text-xs text-pretty text-muted-foreground">
            Trial ends {dayjs(endDate).fromNow()}
          </CardDescription>
        )}
      </CardHeader>

      {usage && (
        <CardContent className="px-0 pb-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI Generations</span>
              <span className="font-medium">
                {usage.currentMonth.used} / {usage.currentMonth.limit}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
          </div>
        </CardContent>
      )}

      {isCustomTrial && isTrialEnding && (
        <CardFooter className="px-0">
          <Button asChild variant="outline" size="sm" className="w-full text-xs">
            <Link
              to="/$organizationSlug/billing"
              params={{ organizationSlug: props.organizationSlug }}
            >
              <Crown className="size-3" />
              <span>Upgrade Plan</span>
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function AppSidebarPlanUsageSkeleton() {
  return (
    <Card className="p-2 gap-0">
      <CardHeader className="px-0 gap-0">
        <Skeleton className="h-16 w-full rounded-md" />
      </CardHeader>
    </Card>
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
              Teams
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

        <Suspense fallback={<AppSidebarPlanUsageSkeleton />}>
          <AppSidebarPlanUsage organizationSlug={props.organizationSlug} />
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
            <SidebarGroupLabel>Teams</SidebarGroupLabel>
            <SidebarGroupContent>
              <AppSidebarTeamsSkeleton />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-0 max-sm:p-2">
          <Suspense fallback={<AppSidebarPlanUsageSkeleton />}>
            <AppSidebarPlanUsage organizationSlug={params?.organizationSlug ?? ""} />
          </Suspense>

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
