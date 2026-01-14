import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["mathlive", "@cortex-js/compute-engine"],
};

export default nextConfig;
