import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ensureNotLoggedIn } from "../-lib/common";

export const Route = createFileRoute("/(auth)/_layout")({
  component: RouteComponent,
  beforeLoad: async ({ context: { queryClient } }) => {
    await ensureNotLoggedIn(queryClient);
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
