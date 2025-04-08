import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@asyncstatus/ui"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
