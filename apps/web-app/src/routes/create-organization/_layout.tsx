import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth";

export const Route = createFileRoute("/create-organization/_layout")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (session.error || !session.data) {
      throw redirect({ to: "/sign-in" });
    }

    // if (session.data.session.activeOrganizationId) {
    //   throw redirect({ to: "/" });
    // }
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
