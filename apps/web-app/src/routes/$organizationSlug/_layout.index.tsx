import { getOrganizationQueryOptions } from "@/rpc/organization";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$organizationSlug/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();
  const organization = useSuspenseQuery(
    getOrganizationQueryOptions(organizationSlug),
  );

  return <div>{organization.data?.name}</div>;
}
