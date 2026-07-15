import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wisp is a single-tenant household app; no image CDN, no external rewrites.
  // Fully Kiosk REST and the tailnet are reached server-side, never proxied here.
  reactStrictMode: true,
};

export default nextConfig;
