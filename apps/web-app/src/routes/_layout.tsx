import { listUserInvitationsContract } from "@asyncstatus/api/typed-handlers/invitation";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebarSkeleton } from "@/components/app-sidebar";
import { ensureValidOrganization, ensureValidSession } from "@/routes/-lib/common";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  loader: async ({ context: { queryClient }, location }) => {
    const { session } = await ensureValidSession(queryClient, location);
    if (!session.activeOrganizationSlug) {
      const invitations = await queryClient.ensureQueryData(
        typedQueryOptions(listUserInvitationsContract, {}),
      );
      if (invitations.length > 0) {
        throw redirect({ to: "/invitations" });
      }
      throw redirect({ to: "/create-organization" });
    }
    const { organization } = await ensureValidOrganization(
      queryClient,
      session.activeOrganizationSlug,
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
