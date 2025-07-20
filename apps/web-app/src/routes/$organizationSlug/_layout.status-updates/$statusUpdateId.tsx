import { getOrganizationContract } from "@asyncstatus/api/typed-handlers/organization";
import { getStatusUpdateContract } from "@asyncstatus/api/typed-handlers/status-update";
import { dayjs, formatRelativeTime } from "@asyncstatus/dayjs";
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { StatusUpdateForm } from "@/components/status-update-form";
import { ensureValidOrganization } from "@/routes/-lib/common";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/$organizationSlug/_layout/status-updates/$statusUpdateId")({
  beforeLoad: async ({ params: { organizationSlug }, context: { queryClient } }) => {
    await ensureValidOrganization(queryClient, organizationSlug);
  },
  loader: async ({ params: { organizationSlug, statusUpdateId }, context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      typedQueryOptions(
        getStatusUpdateContract,
        { idOrSlug: organizationSlug, statusUpdateIdOrDate: statusUpdateId },
        { throwOnError: false },
      ),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { statusUpdateId, organizationSlug } = Route.useParams();
  const organization = useQuery(
    typedQueryOptions(getOrganizationContract, { idOrSlug: organizationSlug }),
  );
  const statusUpdate = useQuery(
    typedQueryOptions(
      getStatusUpdateContract,
      { idOrSlug: organizationSlug, statusUpdateIdOrDate: statusUpdateId },
      { throwOnError: false },
    ),
  );
  const isOwner = useMemo(() => {
    return statusUpdate.data?.member.id === organization.data?.member.id;
  }, [statusUpdate.data, organization.data]);

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
                <BreadcrumbLink asChild>
                  <Link
                    to="/$organizationSlug"
                    params={{ organizationSlug }}
                    search={{
                      date: dayjs(statusUpdate.data?.effectiveFrom).format("YYYY-MM-DD"),
                      memberId: statusUpdate.data?.member.id,
                    }}
                  >
                    {statusUpdate.data?.member.user.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {formatRelativeTime(statusUpdate.data?.effectiveFrom)}{" "}
                  {statusUpdate.data?.isDraft ? "(draft)" : ""}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="py-4 mt-4">
        <div className="mx-auto w-full max-w-3xl">
          <StatusUpdateForm
            readonly={!isOwner}
            statusUpdateId={statusUpdateId}
            organizationSlug={organizationSlug}
          />
        </div>
      </div>
    </>
  );
}
