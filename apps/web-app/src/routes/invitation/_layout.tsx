import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod/v4";

export const Route = createFileRoute("/invitation/_layout")({
  component: RouteComponent,
  validateSearch: z.object({
    invitationId: z.string(),
    invitationEmail: z.string().email(),
  }),
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
