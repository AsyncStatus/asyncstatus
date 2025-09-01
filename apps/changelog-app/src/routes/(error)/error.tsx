import { Button } from "@asyncstatus/ui/components/button";
import { SimpleLayout } from "@asyncstatus/ui/components/simple-layout";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod/v4";

export const Route = createFileRoute("/(error)/error")({
  component: RouteComponent,
  validateSearch: z.object({
    "error-title": z.string().optional(),
    "error-description": z.string().optional(),
  }),
});

function RouteComponent() {
  const search = Route.useSearch();

  return (
    <SimpleLayout href="/">
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <h1 className="text-2xl font-bold">{search["error-title"] || "Error"}</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {search["error-description"] || "Something went wrong. Please try again."}
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Go to home</Link>
        </Button>
      </div>
    </SimpleLayout>
  );
}
