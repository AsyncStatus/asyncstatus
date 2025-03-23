import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { CreateOrganizationForm } from "@/components/create-organization-form";

export const Route = createFileRoute("/create-organization/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto w-full max-w-xs space-y-24">
      <CreateOrganizationForm
        onSuccess={(data) => {
          navigate({
            to: "/$organizationSlug",
            params: { organizationSlug: data.slug },
          });
        }}
      />
    </div>
  );
}
