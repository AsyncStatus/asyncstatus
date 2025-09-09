import "./globals.css";

import { SquircleNoScript } from "@squircle-js/react";
import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import localFont from "next/font/local";
import { PostHogProvider } from "./providers";

const favorit = localFont({
  src: [
    { path: "./fonts/ABCFavorit-Bold.woff2", weight: "700" },
    { path: "./fonts/ABCFavorit-Medium.woff2", weight: "500" },
    { path: "./fonts/ABCFavorit-Regular.woff2", weight: "400" },
  ],
  variable: "--font-favorit",
});

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "Async status updates for remote startups",
  description: "Made for high-agency teams that value their time.",
  metadataBase: new URL("https://asyncstatus.com"),
  icons: [
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
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${favorit.variable} ${noto.variable}`}>
        <SquircleNoScript />
        <PostHogProvider>{props.children}</PostHogProvider>
      </body>
    </html>
  );
}
