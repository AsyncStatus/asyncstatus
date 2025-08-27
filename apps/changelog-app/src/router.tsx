import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { CancelledError, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { DefaultErrorBoundary } from "./components/default-error-boundary";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        throwOnError: (error) => {
          if (error instanceof CancelledError) {
            return false;
          }

          return true;
        },
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: () => {
      return (
        <div className="fixed inset-0 flex items-center justify-center">
          <AsyncStatusLogo className="h-4 w-auto animate-pulse duration-1000" />
        </div>
      );
    },
    defaultErrorComponent: DefaultErrorBoundary,
    defaultNotFoundComponent: NotFound,
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
