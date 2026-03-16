import type { NextConfig } from 'next';
import { DEV_BACKEND_URL } from '../constants';

const nextConfig: NextConfig = {
  // 로컬 개발: /v1/project/* 요청을 NestJS 백엔드로 프록시
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
