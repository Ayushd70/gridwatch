import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mqtt", "ws"],
};

export default nextConfig;
