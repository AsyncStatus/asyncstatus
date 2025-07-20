import { listMemberOrganizationsContract } from "@asyncstatus/api/typed-handlers/organization";
import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureValidSession } from "@/routes/-lib/common";
import { typedQueryOptions } from "@/typed-handlers";

export const Route = createFileRoute("/create-organization/_layout")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, location }) => {
    await ensureValidSession(queryClient, location);
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(
      typedQueryOptions(listMemberOrganizationsContract, {}, { throwOnError: false }),
    );
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
