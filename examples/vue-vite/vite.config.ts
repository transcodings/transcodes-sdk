import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { DEV_BACKEND_URL } from '../constants';

export default defineConfig({
  plugins: [vue()],
  server: {
    // Local dev: proxy /v1/project/* requests to the NestJS backend
    proxy: {
      '/v1/project': DEV_BACKEND_URL,
    },
  },
});
