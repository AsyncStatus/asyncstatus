import { useMemo } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@asyncstatus/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@asyncstatus/ui/components/dropdown-menu";
import { ScrollArea } from "@asyncstatus/ui/components/scroll-area";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@asyncstatus/ui/components/sidebar";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { ChevronsUpDown, Plus } from "@asyncstatus/ui/icons";
import { Link } from "@tanstack/react-router";

import { authClient } from "@/lib/auth";
import { getInitials } from "@/lib/utils";

export function OrganizationSelect() {
  const { isMobile } = useSidebar();
  const session = authClient.useSession();
  const organizations = authClient.useListOrganizations();
  const activeOrganization = useMemo(
    () =>
      organizations.data?.find(
        (o) => o.id === session.data?.session.activeOrganizationId,
      ),
    [organizations.data, session.data?.session.activeOrganizationId],
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto p-1"
            >
              <Avatar className="size-8">
                <AvatarImage src={undefined} alt={activeOrganization?.name} />
                <AvatarFallback>
                  {getInitials(activeOrganization?.name ?? "")}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left text-sm">
                <span className="truncate">{activeOrganization?.name}</span>
              </div>

              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>

            <ScrollArea className="h-36 w-full">
              {organizations.data?.map((organization) => (
                <DropdownMenuItem
                  asChild
                  key={organization.name}
                  className="gap-2 p-2"
                >
                  <Link
                    to={`/$organizationSlug`}
                    params={{ organizationSlug: organization.slug }}
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={undefined} alt={organization.name} />
                      <AvatarFallback>
                        {getInitials(organization.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="grid flex-1 pt-1 text-left text-sm">
                      <span className="truncate font-semibold">
                        {organization.name}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </ScrollArea>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>

              <div className="text-muted-foreground font-medium">
                Create organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function OrganizationSelectSkeleton() {
  return (
    <div className="flex items-center p-1">
      <Skeleton className="size-8 rounded-full" />
      <ChevronsUpDown className="ml-auto" />
    </div>
  );
}
