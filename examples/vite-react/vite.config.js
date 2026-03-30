import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { DEV_BACKEND_URL } from '../constants';
export default defineConfig({
    plugins: [react()],
    server: {
        // Local dev: proxy /v1/project/* requests to the NestJS backend
        proxy: {
            '/v1/project': DEV_BACKEND_URL,
        },
    },
});
