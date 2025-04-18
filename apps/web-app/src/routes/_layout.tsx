import {
  ensureValidOrganization,
  ensureValidSession,
  getDefaultOrganization,
} from "@/routes/-lib/common";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebarSkeleton } from "@/components/app-sidebar";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const { session } = await ensureValidSession(queryClient, location);
    if (!session.activeOrganizationId) {
      const defaultOrganization = await getDefaultOrganization(queryClient);
      if (!defaultOrganization) {
        throw redirect({ to: "/create-organization" });
      }
      throw redirect({
        to: "/$organizationSlug",
        params: { organizationSlug: defaultOrganization.slug },
      });
    }
    const { organization } = await ensureValidOrganization(
      session.activeOrganizationId,
      queryClient,
    );
    throw redirect({
      to: "/$organizationSlug",
      params: { organizationSlug: organization.slug },
    });
  },
});

function RouteComponent() {
  return <Outlet />;
}
