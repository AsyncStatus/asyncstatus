import {
  ensureValidOrganization,
  ensureValidSession,
} from "@/routes/-lib/common";
import { listMembersQueryOptions } from "@/rpc/organization/member";
import { listOrganizationsQueryOptions } from "@/rpc/organization/organization";
import { listTeamsQueryOptions } from "@/rpc/organization/teams";
import {
  SidebarInset,
  SidebarProvider,
} from "@asyncstatus/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar, AppSidebarSkeleton } from "@/components/app-sidebar";

export const Route = createFileRoute("/$organizationSlug/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  beforeLoad: async ({
    context: { queryClient },
    params: { organizationSlug },
    location,
  }) => {
    await Promise.all([
      ensureValidSession(queryClient, location),
      ensureValidOrganization(organizationSlug, queryClient),
      queryClient.ensureQueryData(listOrganizationsQueryOptions()),
      queryClient.ensureQueryData(listMembersQueryOptions(organizationSlug)),
      queryClient.ensureQueryData(listTeamsQueryOptions(organizationSlug)),
    ]);
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();

  return (
    <SidebarProvider>
      <AppSidebar organizationSlug={organizationSlug} />
      <SidebarInset className="px-4 py-2.5">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
