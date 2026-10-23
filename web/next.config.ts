import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The sandbox/preview host plus common local hosts. Add your own Vercel
  // preview domain here if the dev server ever complains about origins.
  allowedDevOrigins: [
    "*.e2b.app",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
  ],
  // The 14 MB installer is served straight off the CDN as a static asset.
  // Nothing to compile, so keep it out of any webpack/turbopack tracing.
  outputFileTracingExcludes: {
    "/**": ["./public/downloads/**"],
  },
};

export default nextConfig;
