/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { z } from "zod/v4";
import globalsCss from "../globals.css?url";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: searchSchema,
  component: RootComponent,
  // shellComponent: ({ children }) => {
  //   return <div className="flex h-screen w-screen bg-red-500">{children}</div>;
  // },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AsyncStatus" },
    ],
    scripts: [
      {
        src: "/dark-mode.js",
        type: "text/javascript",
        crossorigin: "true",
      },
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      {
        url: "/favicon.ico",
        sizes: "32x32",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.ico",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/icon.svg", type: "image/svg+xml" },
      {
        url: "/apple-touch-icon.png",
        href: "/apple-touch-icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/apple-touch-icon-dark.png",
        href: "/apple-touch-icon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        rel: "preload",
        href: "/ABCFavorit-Regular.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "true",
      },
      {
        rel: "preload",
        href: "/ABCFavorit-Medium.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "true",
      },
      {
        rel: "preload",
        href: "/ABCFavorit-Bold.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "true",
      },
    ],
  }),
});

function RootComponent() {
  useEffect(() => {
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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Suspense>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
        <Suspense>
          <ReactQueryDevtools />
        </Suspense>
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
