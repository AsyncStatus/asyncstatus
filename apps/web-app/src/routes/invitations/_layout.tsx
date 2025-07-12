import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod/v4";

export const Route = createFileRoute("/invitations/_layout")({
  component: RouteComponent,
  validateSearch: z.object({
    invitationId: z.string().optional(),
    invitationEmail: z.email().optional(),
  }),
  head: () => {
    return {
      meta: [{ title: "Invitations - AsyncStatus" }],
    };
  },
});

function RouteComponent() {
  return (
    <SimpleLayout href="/">
      <Outlet />
    </SimpleLayout>
  );
}
