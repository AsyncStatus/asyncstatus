import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import { listMemberOrganizationsContract } from "@asyncstatus/api/typed-handlers/organization";
import { SidebarInset, SidebarProvider } from "@asyncstatus/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar, AppSidebarSkeleton } from "@/components/app-sidebar";
import { ensureValidOrganization, ensureValidSession } from "@/routes/-lib/common";
import { listTeamsQueryOptions } from "@/rpc/organization/teams";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  loader: async ({ context: { queryClient }, params: { organizationSlug }, location }) => {
    const [session, organization, organizations, members, teams] = await Promise.all([
      ensureValidSession(queryClient, location),
      ensureValidOrganization(queryClient, organizationSlug),
      queryClient.ensureQueryData(typedQueryOptions(listMemberOrganizationsContract, {})),
      queryClient.ensureQueryData(
        typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }),
      ),
      queryClient.ensureQueryData(listTeamsQueryOptions(organizationSlug)),
    ]);
    return { session, organization, organizations, members, teams };
  },
  head: async ({ loaderData }) => {
    return {
      meta: [
        {
          title: `${loaderData?.organization.organization.name} - AsyncStatus`,
        },
      ],
    };
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();

  return (
    <SidebarProvider>
      <AppSidebar organizationSlug={organizationSlug} />
      <SidebarInset className="px-3 py-2 sm:px-4 sm:py-2.5">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
