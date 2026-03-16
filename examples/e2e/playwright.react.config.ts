import { defineConfig, devices } from '@playwright/test';
import { DEV_EXAMPLE_PORT, DEV_EXAMPLE_URL } from '../constants';

export default defineConfig({
  testDir: './tests',
  testMatch: 'vite-react.spec.ts',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/vite-react' }]],
  use: {
    baseURL: DEV_EXAMPLE_URL,
    trace: 'on-first-retry',
    actionTimeout: 10000,
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node_modules/.bin/vite --port ${DEV_EXAMPLE_PORT}`,
    cwd: '../vite-react',
    port: DEV_EXAMPLE_PORT,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
