import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@nutrisnap/shared"],
  reactStrictMode: true,
};

export default nextConfig;

