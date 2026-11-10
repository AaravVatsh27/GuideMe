import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@/Frontend/styles/globals.css";
import { AppProviders } from "@/app/providers";
import { ErrorBoundary } from "@/Frontend/components/ErrorBoundary";
import { getAppUrl } from "@/Backend/lib/env";
import { FREE_INTRO_DURATION } from "@/shared/constants";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "Mentra - Your Senior Friend · Your Guide",
    template: "%s | Mentra",
  },
  // Only claims the product backs: mentors are approved before going live, and the intro is free.
  description: `Talk one-on-one with college seniors who have been through the same decisions. Mentors are reviewed before they go live, and your first ${FREE_INTRO_DURATION}-minute intro is free.`,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/brand/mentra-icon.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/brand/mentra-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
    >
      <body className="antialiased">
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
