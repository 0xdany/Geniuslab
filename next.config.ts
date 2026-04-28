import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {},
  serverExternalPackages: ["@google-cloud/storage", "archiver"],
};

export default nextConfig;
