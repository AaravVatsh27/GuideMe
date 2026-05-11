import { createRequire } from "node:module";
import { withSentryConfig } from "@sentry/nextjs";

const require = createRequire(import.meta.url);

function loadBundleAnalyzer() {
  try {
    const withBundleAnalyzer = require("@next/bundle-analyzer");
    return withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });
  } catch {
    return (config) => config;
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://guideme.app";

/**
 * Content-Security-Policy tailored to GuideMe's actual third-party services.
 * Adjust the nonce/hash approach when inline scripts are needed by specific pages.
 */
const CSP = [
  "default-src 'self'",
  // Scripts: self + Razorpay checkout + Sentry CDN
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://browser.sentry-cdn.com",
  // Styles: self + inline (needed by Tailwind/shadcn) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com data:",
  // Images: self + Google user avatars + UploadThing CDN + data URIs
  "img-src 'self' blob: data: https://lh3.googleusercontent.com https://utfs.io https://*.utfs.io https://uploadthing.com https://*.uploadthing.com https://*.supabase.co",
  // API connections: self + Upstash + Razorpay + Daily.co + Sentry + UploadThing + Resend
  "connect-src 'self' https://*.upstash.io https://api.razorpay.com https://livekit.io https://*.daily.co wss://*.daily.co https://*.sentry.io https://uploadthing.com https://*.uploadthing.com https://api.resend.com",
  // Frames: Razorpay payment modal + Daily.co video
  "frame-src 'self' https://api.razorpay.com https://*.daily.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            // 2-year HSTS with subdomains — only effective over HTTPS
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: CSP,
          },
          {
            // Block camera/microphone globally; individual pages can override via JS API
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
        ],
      },
      {
        // Allow camera/microphone on session pages for video calls
        source: "/session/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), payment=(self)",
          },
        ],
      },
    ];
  },
};

// Suppress unused variable warning — APP_URL reserved for future dynamic CSP
void APP_URL;

const bundledConfig = loadBundleAnalyzer()(nextConfig);

export default withSentryConfig(bundledConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  treeshake: {
    removeDebugLogging: true,
  },
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
