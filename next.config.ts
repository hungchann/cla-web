import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// Automate migration: delete deprecated middleware.ts if it exists
try {
  const middlewarePath = path.join(process.cwd(), "middleware.ts");
  if (fs.existsSync(middlewarePath)) {
    fs.unlinkSync(middlewarePath);
    console.log("[Proxy Migration] Successfully deleted deprecated middleware.ts");
  }
} catch (e) {
  console.error("[Proxy Migration] Failed to delete middleware.ts:", e);
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "marutek.space",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.marutek.space",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "sunchinese.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.sunchinese.vn",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
};

export default nextConfig;
