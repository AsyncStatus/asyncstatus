import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@asyncstatus/ui"],
};

export default nextConfig;
