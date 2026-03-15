import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'nextjs.spec.ts',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/nextjs' }]],
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
    command: 'node_modules/.bin/next dev --port 9999',
    cwd: '../nextjs',
    port: 9999,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
