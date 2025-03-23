import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@asyncstatus/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  OrganizationMenu,
  OrganizationMenuSkeleton,
} from "./organization-menu";
import { UserMenu, UserMenuSkeleton } from "./user-menu";

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

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
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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

export function AppSidebarSkeleton() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <OrganizationMenuSkeleton />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
