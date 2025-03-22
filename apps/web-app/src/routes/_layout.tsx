import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth";
import { rpc } from "@/lib/rpc";
import { AppSidebarSkeleton } from "@/components/app-sidebar";

export const Route = createFileRoute("/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.error || !session.data) {
      throw redirect({ to: "/sign-in" });
    }
    if (!session.data.session.activeOrganizationId) {
      throw redirect({ to: "/create-organization" });
    }

    const orgResponse = await rpc.organization[":idOrSlug"].$get({
      param: { idOrSlug: session.data.session.activeOrganizationId },
    });
    if (!orgResponse.ok) {
      const org = await getDefaultOrganization();
      throw redirect({
        to: "/$organizationSlug",
        params: { organizationSlug: org.slug },
      });
    }

    const org = await orgResponse.json();
    if (!org.slug) {
      const org = await getDefaultOrganization();
      throw redirect({
        to: "/$organizationSlug",
        params: { organizationSlug: org.slug },
      });
    }

    throw redirect({
      to: "/$organizationSlug",
      params: { organizationSlug: org.slug },
    });
  },
});

async function getDefaultOrganization() {
  const orgs = await authClient.organization.list();
  if (!orgs.data || orgs.data.length === 0 || !orgs.data[0] || orgs.error) {
    throw redirect({ to: "/create-organization" });
  }

  return orgs.data[0];
}

function RouteComponent() {
  return <Outlet />;
}
