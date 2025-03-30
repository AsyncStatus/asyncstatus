import { Suspense, type PropsWithChildren } from "react";
import { Button } from "@asyncstatus/ui/components/button";
import {
  Card,
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
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import { Home, LifeBuoy, Send, Settings, Sun, Users } from "lucide-react";

import {
  OrganizationMenu,
  OrganizationMenuSkeleton,
} from "./organization-menu";
import { UserMenu, UserMenuSkeleton } from "./user-menu";

function AppSidebarLinks(props: { organizationSlug: string }) {
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to="/$organizationSlug"
            params={{ organizationSlug: props.organizationSlug }}
          >
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
        <CardTitle className="text-md">We're in beta</CardTitle>
        <CardDescription className="text-xs text-pretty">
          We're working hard to bring you the best experience but there are some
          features that are still under development or not available.
        </CardDescription>
      </CardHeader>
      <CardFooter className="px-0">
        <div className="flex w-full flex-col items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            asChild
          >
            <a
              href="mailto:support@asyncstatus.com"
              target="_blank"
              rel="noreferrer"
            >
              <LifeBuoy className="size-3" />
              <span>Report an issue</span>
            </a>
          </Button>
          <Button size="sm" className="w-full text-xs" asChild>
            <a
              href="mailto:kacper@asyncstatus.com"
              target="_blank"
              rel="noreferrer"
            >
              <Send className="size-3" />
              <span>Give feedback</span>
            </a>
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
          <SidebarGroupContent>
            <SidebarMenu>
              <AppSidebarLinks organizationSlug={props.organizationSlug} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0 max-sm:p-2">
        <AppSidebarBetaNotice />
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
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
            <SidebarGroupContent>
              <SidebarMenu>
                <AppSidebarLinks
                  organizationSlug={params?.organizationSlug ?? ""}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-0 max-sm:p-2">
          <AppSidebarBetaNotice />
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="gap-4 px-4 py-2.5">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
