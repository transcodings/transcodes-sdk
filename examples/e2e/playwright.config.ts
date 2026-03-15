import { defineConfig, devices } from '@playwright/test';

/**
 * 4개 프레임워크 예제 앱 e2e 테스트 설정.
 * 각 dev 서버를 자동으로 시작하고, 테스트 완료 후 종료.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    // CDN 로드 시간을 감안한 기본 타임아웃
    actionTimeout: 10000,
    // SLOW_MO=500 환경변수로 슬로우모션 속도 조절 (ms)
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../nextjs',
      port: 9999,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      cwd: '../sveltekit',
      port: 9999,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      cwd: '../vite-react',
      port: 9999,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev',
      cwd: '../vue-vite',
      port: 9999,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
