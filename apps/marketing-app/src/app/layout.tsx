import "./globals.css";

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
  title: {
    default: "AsyncStatus - Replace Daily Standups with Automated Status Updates",
    template: "%s | AsyncStatus"
  },
  description: "Stop wasting time in daily standups. AsyncStatus automatically generates status updates from your Git commits, Jira tickets, and Slack activity. Save 2-3 hours per developer per week.",
  keywords: [
    "async status updates",
    "remote team management",
    "standup replacement",
    "team productivity",
    "remote work tools",
    "automated status reports",
    "software development tools",
    "team communication",
    "agile without meetings",
    "distributed teams"
  ],
  authors: [{ name: "AsyncStatus Team" }],
  creator: "AsyncStatus",
  publisher: "AsyncStatus",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://asyncstatus.com"),
  alternates: {
    canonical: "https://asyncstatus.com",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://asyncstatus.com",
    title: "AsyncStatus - Replace Daily Standups with Automated Status Updates",
    description: "Stop wasting time in daily standups. AsyncStatus automatically generates status updates from your Git commits, Jira tickets, and Slack activity. Save 2-3 hours per developer per week.",
    siteName: "AsyncStatus",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "AsyncStatus - Automated status updates for remote teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AsyncStatus - Replace Daily Standups with Automated Status Updates",
    description: "Stop wasting time in daily standups. AsyncStatus automatically generates status updates from your Git commits, Jira tickets, and Slack activity.",
    images: ["/opengraph-image.jpg"],
    creator: "@asyncstatus",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Replace with actual verification code
  },
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
    {
      url: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${favorit.variable} ${noto.variable}`}>
        <PostHogProvider>{props.children}</PostHogProvider>
      </body>
    </html>
  );
}
