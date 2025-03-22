import { SidebarProvider } from "@asyncstatus/ui/components/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth";
import { rpc } from "@/lib/rpc";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/$organizationSlug/_layout")({
  component: RouteComponent,
  beforeLoad: async ({ params: { organizationSlug } }) => {
    const session = await authClient.getSession();
    if (session.error || !session.data) {
      throw redirect({ to: "/sign-in" });
    }

    const orgResponse = await rpc.organization[":idOrSlug"].$get({
      param: { idOrSlug: organizationSlug },
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
  return (
    <SidebarProvider>
      <AppSidebar />
      <Outlet />
    </SidebarProvider>
  );
}
