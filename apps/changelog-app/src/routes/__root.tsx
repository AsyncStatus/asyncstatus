/// <reference types="vite/client" />

import { Toaster } from "@asyncstatus/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { lazy, useEffect } from "react";
import { z } from "zod/v4";
import { NoiseBackground } from "../components/noise-background";
import globalsCss from "../globals.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Changelog Generator" },
    ],
    scripts: [
      {
        src: "/dark-mode.js",
        type: "text/javascript",
        crossOrigin: "anonymous",
      },
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      {
        url: "/favicon.ico",
        sizes: "32x32",
      },
      { url: "/icon.svg", type: "image/svg+xml" },
      {
        rel: "preload",
        href: "/ABCFavorit-Regular.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/ABCFavorit-Medium.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/ABCFavorit-Bold.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/ABCStefan-Simple.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
});

function RootComponent() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="w-full h-full">
      <head>
        <HeadContent />
      </head>
      <body className="w-full h-full relative">
        {children}
        <NoiseBackground />
        {/* <Suspense>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
        <Suspense>
          <ReactQueryDevtools />
        </Suspense> */}
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}

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
