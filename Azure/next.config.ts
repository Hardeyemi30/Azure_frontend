import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",

  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
