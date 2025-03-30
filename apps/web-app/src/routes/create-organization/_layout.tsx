import { ensureValidSession } from "@/routes/-lib/common";
import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/create-organization/_layout")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient }, location }) => {
    await ensureValidSession(queryClient, location);
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
