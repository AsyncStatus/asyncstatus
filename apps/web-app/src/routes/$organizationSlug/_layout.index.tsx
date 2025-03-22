import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$organizationSlug/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/$organizationSlug/_layout/"!</div>;
}
