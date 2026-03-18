import type { NextConfig } from 'next';
import { DEV_BACKEND_URL } from '../constants';

const nextConfig: NextConfig = {
  // Local dev: proxy /v1/project/* requests to the NestJS backend
  async rewrites() {
    return [
      {
        source: '/v1/project/:path*',
        destination: `${DEV_BACKEND_URL}/v1/project/:path*`,
      },
    ];
  },
};

export default nextConfig;
