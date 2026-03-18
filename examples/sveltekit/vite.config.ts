import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { DEV_BACKEND_URL } from '../constants';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // Local dev: proxy /v1/project/* requests to the NestJS backend
    proxy: {
      '/v1/project': DEV_BACKEND_URL,
    },
  },
});
