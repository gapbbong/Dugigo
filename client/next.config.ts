import type { NextConfig } from "next";

const nextConfig: any = {
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/data/**/*'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
