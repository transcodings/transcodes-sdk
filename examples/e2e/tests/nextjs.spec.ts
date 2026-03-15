import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9999';
const PROJECT_ID = 'K2UTF2ce3c';

test.describe('Next.js 15 (App Router) — SDK 통합', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('초기 UI 렌더링', async ({ page }) => {
    await expect(page.getByText('Transcodes SDK — Next.js 15 (App Router)')).toBeVisible();
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

  test('openAuthLoginModal — API 응답 반환 확인', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole('button', { name: 'Login Modal' })).toBeEnabled();

    // window.transcodes.openAuthLoginModal() 직접 호출하여 응답 구조 검증
    // localhost에서는 도메인 불일치로 success: false 반환이 정상 동작
    const result = await page.evaluate(async () => {
      const res = await (window as any).transcodes.openAuthLoginModal({ webhookNotification: false });
      return res;
    });

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('payload');
    // success 값과 무관하게 ApiResponse 구조를 반환해야 함
    expect(typeof result.success).toBe('boolean');
  });
});
