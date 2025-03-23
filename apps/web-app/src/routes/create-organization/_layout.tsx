import { ensureValidSession } from "@/routes/-lib/common";
import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/create-organization/_layout")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient } }) => {
    await ensureValidSession(queryClient);
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
