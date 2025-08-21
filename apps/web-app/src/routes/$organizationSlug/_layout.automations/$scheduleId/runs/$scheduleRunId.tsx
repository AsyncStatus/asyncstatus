import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$organizationSlug/_layout/automations/$scheduleId/runs/$scheduleRunId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { scheduleRunId } = Route.useParams();
  return <div>{scheduleRunId}</div>;
}
