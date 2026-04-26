import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadBundleAnalyzer() {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer");
    return withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
  } catch {
    return (config) => config;
  }
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "*.uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.utfs.io",
      },
      {
        protocol: "https",
        hostname: "supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default loadBundleAnalyzer()(nextConfig);
