/// <reference types="vite/client" />

import { Toaster } from "@asyncstatus/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
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
    links: [
      { rel: "stylesheet", href: globalsCss },
      { url: "/favicon.ico", sizes: "32x32" },
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
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="w-full h-full">
      <head>
        <HeadContent />
      </head>
      <body className="w-full h-full relative">
        {children}
        <NoiseBackground />
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
