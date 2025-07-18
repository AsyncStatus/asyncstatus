import { isAsyncStatusApiJsonError } from "@asyncstatus/api/errors";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { toast } from "@asyncstatus/ui/components/sonner";
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { DefaultErrorBoundary } from "./components/default-error-boundary";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        throwOnError: true,
        retry: (failureCount, error) => {
          if (isAsyncStatusApiJsonError(error)) {
            if (error.type === "ASAPIUnexpectedError") {
              return failureCount <= 5;
            }

            return false;
          }

          return failureCount <= 5;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        onError(error) {
          if (isAsyncStatusApiJsonError(error)) {
            console.error(error);
            toast.error(error.message);
          } else {
            toast.error("An unexpected error occurred. Please try again later.");
          }
        },
      },
    },
  });

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultPreload: "intent",
      scrollRestoration: true,
      defaultStructuralSharing: true,
      defaultPreloadStaleTime: 0,
      defaultPendingComponent: () => {
        return (
          <div className="flex h-screen w-screen items-center justify-center">
            <AsyncStatusLogo className="h-4 w-auto animate-pulse duration-1000" />
          </div>
        );
      },
      defaultErrorComponent: DefaultErrorBoundary,
      defaultNotFoundComponent: NotFound,
    }),
    queryClient,
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
