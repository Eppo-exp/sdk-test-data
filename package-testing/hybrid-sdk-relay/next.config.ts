import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    rewrites: async () => [
        { source: '/flags/:path*', destination: '/api/flags/:path*' },
        { source: '/precomputed/:path*', destination: '/api/precomputed/:path*' },
    ]
};

export default nextConfig;
