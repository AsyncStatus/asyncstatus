import { getOrganizationQueryOptions } from "@/rpc/organization/organization";
import { getStatusUpdatesByMemberQueryOptions } from "@/rpc/organization/status-update";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@asyncstatus/ui/components/breadcrumb";
import { Separator } from "@asyncstatus/ui/components/separator";
import { SidebarTrigger } from "@asyncstatus/ui/components/sidebar";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
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
    <>
      <header className="flex flex-col gap-3 pb-4 sm:pb-0">
        <div className="flex items-center gap-0">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/$organizationSlug"
                    params={{ organizationSlug }}
                  >
                    Status updates
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Status Update</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="py-4">
        <div className="mx-auto w-full max-w-3xl">
          <StatusUpdateForm organizationSlug={organizationSlug} />
        </div>
      </div>
    </>
  );
}
