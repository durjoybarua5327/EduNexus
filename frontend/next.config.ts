import type { NextConfig } from "next";

// Trigger restart for env load

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: 'http://127.0.0.1:3001/api/:path',
      },
    ];
  },
};

export default nextConfig;
