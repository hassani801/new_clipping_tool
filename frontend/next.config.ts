import type { NextConfig } from "next";
import path from "node:path";

const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  // The frontend is a nested repo inside the npm-workspaces monorepo root, and
  // dependencies are hoisted to the root node_modules. Point Turbopack at the
  // workspace root so module resolution can find the hoisted packages.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

