import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@asyncstatus/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { Home, Settings, Users } from "lucide-react";

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

export function AppSidebar(props: { organizationSlug: string }) {
  return (
    <Sidebar>
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
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export function AppSidebarSkeleton(props: { organizationSlug: string }) {
  return (
    <SidebarProvider>
      <Sidebar>
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
        <UserMenuSkeleton />
      </SidebarFooter>

      <SidebarRail />
    </SidebarProvider>
  );
}
