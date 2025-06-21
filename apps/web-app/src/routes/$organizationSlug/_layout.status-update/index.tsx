import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import { getStatusUpdatesByMemberQueryOptions } from "@/rpc/organization/status-update";
import { createFileRoute, redirect } from "@tanstack/react-router";
import dayjs from "dayjs";

import { StatusUpdateForm } from "@/components/status-update-form-v2";

export const Route = createFileRoute(
  "/$organizationSlug/_layout/status-update/",
)({
  component: RouteComponent,
  beforeLoad: async ({
    params: { organizationSlug },
    context: { queryClient },
  }) => {
    const { member } = await queryClient.ensureQueryData(
      getOrganizationQueryOptions(organizationSlug),
    );

    const statusUpdates = await queryClient.ensureQueryData(
      getStatusUpdatesByMemberQueryOptions(
        { idOrSlug: organizationSlug, memberId: member.id },
        { effectiveFrom: dayjs().startOf("day").toISOString() },
      ),
    );

    if (
      (statusUpdates as any).length === 0 ||
      !(statusUpdates as any)[0].isDraft
    ) {
      throw redirect({
        to: "/$organizationSlug/status-update/$statusUpdateId",
        params: {
          organizationSlug,
          statusUpdateId: dayjs().startOf("day").format("YYYY-MM-DD"),
        },
      });
    }

    throw redirect({
      to: "/$organizationSlug/status-update/$statusUpdateId",
      params: {
        organizationSlug,
        statusUpdateId: (statusUpdates[0] as any).id,
      },
    });
  },
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StatusUpdateForm organizationSlug={organizationSlug} />
    </div>
  );
}
