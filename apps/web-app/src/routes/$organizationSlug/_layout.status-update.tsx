import { createFileRoute } from "@tanstack/react-router";

import { StatusUpdateForm } from "@/components/status-update-form-v2";

export const Route = createFileRoute(
  "/$organizationSlug/_layout/status-update",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationSlug } = Route.useParams();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StatusUpdateForm organizationSlug={organizationSlug} />
    </div>
  );
}
