import { getGithubIntegrationContract } from "@asyncstatus/api/typed-handlers/github-integration";
import { listMembersContract } from "@asyncstatus/api/typed-handlers/member";
import { listMemberOrganizationsContract } from "@asyncstatus/api/typed-handlers/organization";
import { listTeamsContract } from "@asyncstatus/api/typed-handlers/team";
import { SidebarInset, SidebarProvider } from "@asyncstatus/ui/components/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar, AppSidebarSkeleton } from "@/components/app-sidebar";
import { MemberTimezoneChecker } from "@/components/member-timezone-checker";
import { OnboardingModal } from "@/components/onboarding-modal";
import { OrganizationSubscriptionChecker } from "@/components/organization-subscription-checker";
import { ensureValidOrganization, ensureValidSession } from "@/routes/-lib/common";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout")({
  component: RouteComponent,
  pendingComponent: AppSidebarSkeleton,
  loader: async ({ context: { queryClient }, params: { organizationSlug }, location }) => {
    const [_session, organization, organizations, members, teams] = await Promise.all([
      ensureValidSession(queryClient, location),
      ensureValidOrganization(queryClient, organizationSlug),
      queryClient.ensureQueryData(typedQueryOptions(listMemberOrganizationsContract, {})),
      queryClient.ensureQueryData(
        typedQueryOptions(listMembersContract, { idOrSlug: organizationSlug }),
      ),
      queryClient.ensureQueryData(
        typedQueryOptions(listTeamsContract, { idOrSlug: organizationSlug }),
      ),
      queryClient.prefetchQuery(
        typedQueryOptions(getGithubIntegrationContract, { idOrSlug: organizationSlug }),
      ),
    ]);
    return { organization, organizations, members, teams };
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
        <OrganizationSubscriptionChecker />
        <MemberTimezoneChecker />
        <OnboardingModal organizationSlug={organizationSlug} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
