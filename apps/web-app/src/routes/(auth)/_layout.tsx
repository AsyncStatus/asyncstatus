import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { Skeleton } from "@asyncstatus/ui/components/skeleton";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";

import { ensureNotLoggedIn } from "../-lib/common";

export const Route = createFileRoute("/(auth)/_layout")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  validateSearch: z.object({
    invitationId: z.string().optional(),
    invitationEmail: z.string().optional(),
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

function PendingComponent() {
  return (
    <SimpleLayout href={import.meta.env.VITE_MARKETING_APP_URL}>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-2 h-7 w-70" />
      <div className="mt-24 grid gap-5">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-80" />
      </div>
    </SimpleLayout>
  );
}
