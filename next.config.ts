import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // URLs from before the app was split into certification tracks.
  async redirects() {
    return [
      { source: "/read/architect/:slug", destination: "/ccar-f/read/architect/:slug", permanent: true },
      { source: "/read/:book/:slug", destination: "/ccdv-f/read/:book/:slug", permanent: true },
      { source: "/quiz/:path*", destination: "/ccdv-f/quiz/:path*", permanent: true },
      { source: "/quiz", destination: "/ccdv-f/quiz", permanent: true },
    ]
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
