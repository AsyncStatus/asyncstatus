import { Suspense } from "react";
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
import { Link } from "@tanstack/react-router";
import { Home, LifeBuoy, Send, Settings, Users } from "lucide-react";

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
            <Home />
            <span>Status updates</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to={"/$organizationSlug/users" as any}
            params={{ organizationSlug: props.organizationSlug } as any}
          >
            <Users />
            <span>Users</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link
            to={"/$organizationSlug/settings" as any}
            params={{ organizationSlug: props.organizationSlug } as any}
          >
            <Settings />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

function AppSidebarSecondaryLinks() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a
                href="mailto:support@asyncstatus.com"
                target="_blank"
                rel="noreferrer"
              >
                <LifeBuoy />
                <span>Support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a
                href="mailto:kacper@asyncstatus.com"
                target="_blank"
                rel="noreferrer"
              >
                <Send />
                <span>Feedback</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
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

      <SidebarFooter>
        <AppSidebarSecondaryLinks />
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebarSkeleton(props: { organizationSlug: string }) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <OrganizationMenuSkeleton />
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
      </Sidebar>

      <SidebarFooter>
        <AppSidebarSecondaryLinks />
        <UserMenuSkeleton />
      </SidebarFooter>

      <SidebarInset />
    </SidebarProvider>
  );
}
