import type { NextConfig } from "next";

const nextConfig: any = {
  outputFileTracingIncludes: {
    '/api/units': ['./src/data/**/*.json'],
    '/api/questions': ['./src/data/**/*.json'],
    '/api/subjects': ['./src/data/**/*.json'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
