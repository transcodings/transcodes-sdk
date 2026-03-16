import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { DEV_BACKEND_URL } from '../constants';

export default defineConfig({
  plugins: [react()],
  server: {
    // 로컬 개발: /v1/project/* 요청을 NestJS 백엔드로 프록시
    proxy: {
      '/v1/project': DEV_BACKEND_URL,
    },
  },
});
