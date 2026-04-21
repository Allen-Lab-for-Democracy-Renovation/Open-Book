import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-better-sqlite3"],
  turbopack: {
    root: resolve(__dirname),
  },
};

export default nextConfig;
