import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {},
    reactCompiler: true,
  },
  eslint: {
    dirs: ["app", "components", "lib", "prisma"],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
