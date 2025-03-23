import { lazy, Suspense } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <>
      <Outlet />
      <Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
      <Suspense>
        <ReactQueryDevtools />
      </Suspense>
    </>
  ),
});

const TanStackRouterDevtools =
  import.meta.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

const ReactQueryDevtools =
  import.meta.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-query-devtools").then((d) => ({
          default: d.ReactQueryDevtools,
        })),
      );
