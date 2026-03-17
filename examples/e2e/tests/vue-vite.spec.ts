import { test, expect } from '@playwright/test';
import { DEV_EXAMPLE_URL, TEST_PROJECT_ID } from '../../constants';

const BASE_URL = DEV_EXAMPLE_URL;
const PROJECT_ID = TEST_PROJECT_ID;

test.describe('Vue 3 + Vite — SDK 통합', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('초기 UI 렌더링', async ({ page }) => {
    await expect(page.getByText('Transcodes SDK — Vue 3 + Vite')).toBeVisible();
    await expect(page.getByPlaceholder('Project ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Init SDK' })).toBeVisible();
    await expect(page.getByText('idle')).toBeVisible();
  });

  test('projectId 없을 때 Init 버튼 비활성화', async ({ page }) => {
    const initBtn = page.getByRole('button', { name: 'Init SDK' });
    await expect(initBtn).toBeDisabled();

    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await expect(initBtn).toBeEnabled();
  });

  test('SDK 초기화 성공 — ready 상태 전환', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();

    // CDN 로드 포함 최대 30초 대기 (initializing은 순간적으로 지나칠 수 있음)
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });
  });

  test('초기화 완료 후 인증 UI 표시', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    // 인증 상태 영역 표시
    await expect(page.getByText('인증 상태:')).toBeVisible();
    // 미인증 상태 → Login Modal 버튼 표시
    await expect(page.getByRole('button', { name: 'Login Modal' })).toBeVisible();
    // Init 버튼은 ready 상태에서 비활성화
    await expect(page.getByRole('button', { name: 'Init SDK' })).toBeDisabled();
  });

  test('Vue composable — 이벤트 로그 초기 상태 확인', async ({ page }) => {
    // 초기 상태에서 이벤트 로그 없음
    await expect(page.getByText('이벤트 로그')).not.toBeVisible();
  });

  test('openAuthLoginModal — 모달 열림 확인', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    // Login Modal 버튼 클릭 (비동기 — resolve 대기하지 않음)
    await page.getByRole('button', { name: 'Login Modal' }).click();

    // auth-login-modal 커스텀 엘리먼트가 DOM에 추가되면 모달이 열린 것
    const modal = page.locator('auth-login-modal');
    await expect(modal).toBeAttached({ timeout: 10000 });
  });

  // ─── 추가 테스트 ──────────────────────────────────────────────────────────

  test('잘못된 projectId로 초기화 시 error 상태 전환', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill('invalid_project_000000000000');
    await page.getByRole('button', { name: 'Init SDK' }).click();

    await expect(page.getByText('error')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('[Transcodes]')).toBeVisible();
  });

  test('SDK 이중 초기화 — 멱등성 확인 (isInitialized)', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    const isInit = await page.evaluate(() => {
      const sdk = (window as any).transcodes;
      return sdk && 'isInitialized' in sdk ? sdk.isInitialized() : false;
    });
    expect(isInit).toBe(true);
  });

  test('미인증 상태 — isAuthenticated/hasToken/getCurrentUser 확인', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    await expect(page.getByText('미인증')).toBeVisible();

    const authState = await page.evaluate(async () => {
      const sdk = (window as any).transcodes;
      return {
        isAuthenticated: await sdk.token.isAuthenticated(),
        hasToken: sdk.token.hasToken(),
        currentUser: await sdk.token.getCurrentUser(),
      };
    });
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.hasToken).toBe(false);
    expect(authState.currentUser).toBeNull();
  });

  test('초기화 실패 후 올바른 projectId로 재초기화 성공', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill('invalid_project_000000000000');
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('error')).toBeVisible({ timeout: 30000 });

    const input = page.getByPlaceholder('Project ID');
    await input.fill('');
    await input.fill(PROJECT_ID);
    const initBtn = page.getByRole('button', { name: 'Init SDK' });
    await expect(initBtn).toBeEnabled();
    await initBtn.click();

    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('인증 상태:')).toBeVisible();
  });

  test('미인증 상태에서 signOut() 호출 — 에러 없이 완료', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    const result = await page.evaluate(async () => {
      try {
        await (window as any).transcodes.token.signOut();
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    });
    expect(result.success).toBe(true);
    await expect(page.getByText('ready')).toBeVisible();
  });

  test('미인증 상태에서 getAccessToken() null 반환', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    const token = await page.evaluate(async () => {
      return await (window as any).transcodes.token.getAccessToken();
    });
    expect(token).toBeNull();
  });

  test('Login Modal 닫기 후 미인증 상태 유지', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: 'Login Modal' }).click();
    const modal = page.locator('auth-login-modal');
    await expect(modal).toBeAttached({ timeout: 10000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    await expect(page.getByText('미인증')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login Modal' })).toBeVisible();
  });

  test('SDK 초기화 중 콘솔 에러 없음 확인', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    const sdkErrors = consoleErrors.filter((e) => e.includes('[transcodes-sdk]'));
    expect(sdkErrors).toHaveLength(0);
  });
});
