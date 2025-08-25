import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="absolute inset-0 z-0 bg-grid-pattern pointer-events-none" />

      <div className="border border-border p-4 rounded-lg">
        <h1 className="text-2xl font-bold">Changelog</h1>
        <p className="text-sm text-muted-foreground">Generate changelogs for your projects.</p>
      </div>
      {/* <h1 className="text-2xl font-bold">Changelog</h1>
      <p className="text-sm text-muted-foreground">Generate changelogs for your projects.</p> */}
    </div>
  );
}
