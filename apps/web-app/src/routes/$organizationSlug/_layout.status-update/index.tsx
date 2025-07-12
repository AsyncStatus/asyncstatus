import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import { listStatusUpdatesByMemberContract } from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs } from "@asyncstatus/dayjs";
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
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { StatusUpdateForm } from "@/components/status-update-form";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/status-update/")({
  component: RouteComponent,
  beforeLoad: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    const { member } = await queryClient.ensureQueryData(
      typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
    );

    const statusUpdates = await queryClient.ensureQueryData(
      typedQueryOptions(listStatusUpdatesByMemberContract, {
        idOrSlug: organizationSlug,
        memberId: member.id,
        effectiveFrom: dayjs().startOf("day").toISOString(),
      }),
    );

    if (statusUpdates.length === 0 || !statusUpdates[0]?.isDraft) {
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
        statusUpdateId: statusUpdates[0].id,
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
                  <Link to="/$organizationSlug" params={{ organizationSlug }}>
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
