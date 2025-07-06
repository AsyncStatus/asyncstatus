import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebarSkeleton } from "@/components/app-sidebar";
import {
  ensureValidOrganization,
  ensureValidSession,
  getDefaultOrganization,
} from "@/routes/-lib/common";

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
      queryClient,
      session.activeOrganizationId,
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
