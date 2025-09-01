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
      { title: "Changelogs AI - Paste your repo. Get clean release notes. Done." },
      {
        name: "description",
        content: "Paste your repo. Get clean release notes. Done.",
      },
      { name: "robots", content: "index,follow" },
      { name: "theme-color", content: "#0B5FFF" },
      // Open Graph
      { property: "og:title", content: "Changelogs AI" },
      {
        property: "og:description",
        content: "Paste your repo. Get clean release notes. Done.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Changelogs AI" },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: "https://changelogs.ai/" },
      { property: "og:image", content: "https://changelogs.ai/opengraph-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Changelogs AI banner" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Changelogs AI" },
      {
        name: "twitter:description",
        content: "Paste your repo. Get clean release notes. Done.",
      },
      { name: "twitter:image", content: "https://changelogs.ai/opengraph-image.jpg" },
      { name: "twitter:image:alt", content: "Changelogs AI banner" },
    ],
    links: [
      { rel: "stylesheet", href: globalsCss },
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "canonical", href: "https://changelogs.ai/" },
      { rel: "shortlink", href: "https://chlgs.ai/" },
      // og-imgage
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
