import {
  ensureValidOrganization,
  ensureValidSession,
} from "@/routes/-lib/common";
import {
  SidebarInset,
  SidebarProvider,
} from "@asyncstatus/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/$organizationSlug/_layout")({
  component: RouteComponent,
  beforeLoad: async ({
    context: { queryClient },
    params: { organizationSlug },
  }) => {
    await ensureValidSession(queryClient);
    await ensureValidOrganization(organizationSlug, queryClient);
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();

  return (
    <SidebarProvider>
      <AppSidebar organizationSlug={organizationSlug} />
      <SidebarInset className="px-4 py-3.5">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
