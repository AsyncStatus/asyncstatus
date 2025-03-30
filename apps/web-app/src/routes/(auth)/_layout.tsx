import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { ensureNotLoggedIn } from "../-lib/common";

export const Route = createFileRoute("/(auth)/_layout")({
  component: RouteComponent,
  validateSearch: z.object({
    invitationId: z.string().optional(),
    invitationEmail: z.string().email().optional(),
  }),
  beforeLoad: async ({ context: { queryClient }, search }) => {
    await ensureNotLoggedIn(queryClient, search);
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href={import.meta.env.VITE_MARKETING_APP_URL}>
      <Outlet />
    </SimpleLayout>
  );
}
