import "./globals.css";

import { StrictMode } from "react";
import { AsyncStatusLogo } from "@asyncstatus/ui/components/async-status-logo";
import { Toaster } from "@asyncstatus/ui/components/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { DefaultErrorBoundary } from "./components/default-error-boundary";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      throwOnError: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
const router = createRouter({
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
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  );
}
