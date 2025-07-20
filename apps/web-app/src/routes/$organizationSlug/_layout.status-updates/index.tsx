import { getMemberStatusUpdateContract } from "@asyncstatus/api/typed-handlers/status-update";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ensureValidOrganization } from "@/routes/-lib/common";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/status-updates/")({
  beforeLoad: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    await ensureValidOrganization(queryClient, organizationSlug);
  },
  loader: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    const statusUpdate = await queryClient.ensureQueryData(
      typedQueryOptions(
        getMemberStatusUpdateContract,
        { idOrSlug: organizationSlug },
        { throwOnError: false },
      ),
    );

    if (!statusUpdate) {
      throw redirect({
        to: "/$organizationSlug",
        params: { organizationSlug },
      });
    }

    throw redirect({
      to: "/$organizationSlug/status-updates/$statusUpdateId",
      params: { organizationSlug, statusUpdateId: statusUpdate.id },
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <AsyncStatusLogo className="h-4 w-auto animate-pulse duration-1000" />
    </div>
  );
}
