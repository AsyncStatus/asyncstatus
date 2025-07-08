import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebarSkeleton } from "@/components/app-sidebar";
import { ensureValidOrganization, ensureValidSession } from "@/routes/-lib/common";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  loader: async ({ context: { queryClient }, location }) => {
    const { session } = await ensureValidSession(queryClient, location);
    if (!session.activeOrganizationId) {
      throw redirect({ to: "/create-organization" });
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
