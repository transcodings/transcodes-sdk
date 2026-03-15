import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'vue-vite.spec.ts',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/vue-vite' }]],
  use: {
    baseURL: 'http://localhost:9999',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node_modules/.bin/vite --port 9999',
    cwd: '../vue-vite',
    port: 9999,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
