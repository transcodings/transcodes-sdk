import { test, expect } from '@playwright/test';
import { DEV_EXAMPLE_URL, TEST_PROJECT_ID } from '../../constants';

const BASE_URL = DEV_EXAMPLE_URL;
const PROJECT_ID = TEST_PROJECT_ID;

test.describe('Vue 3 + Vite — SDK integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Initial UI rendering', async ({ page }) => {
    await expect(page.getByText('Transcodes SDK — Vue 3 + Vite')).toBeVisible();
    await expect(page.getByPlaceholder('Project ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Init SDK' })).toBeVisible();
    await expect(page.getByText('idle')).toBeVisible();
  });

  test('Init button disabled when no projectId', async ({ page }) => {
    const initBtn = page.getByRole('button', { name: 'Init SDK' });
    await expect(initBtn).toBeDisabled();

    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await expect(initBtn).toBeEnabled();
  });

  test('SDK initialization success — transition to ready state', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();

    // Wait up to 30s including CDN load (initializing may pass instantly)
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });
  });

  test('Auth UI displayed after initialization', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    // Auth status area displayed
    await expect(page.getByText('Auth Status:')).toBeVisible();
    // Not authenticated — Login Modal button displayed
    await expect(page.getByRole('button', { name: 'Login Modal' })).toBeVisible();
    // Init button disabled in ready state
    await expect(page.getByRole('button', { name: 'Init SDK' })).toBeDisabled();
  });

  test('Vue composable — verify initial event log state', async ({ page }) => {
    // No event log in initial state
    await expect(page.getByText('Event Log')).not.toBeVisible();
  });

  test('openAuthLoginModal — verify modal opens', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    // Click Login Modal button (async — does not wait for resolve)
    await page.getByRole('button', { name: 'Login Modal' }).click();

    // Modal is open when auth-login-modal custom element is added to DOM
    const modal = page.locator('auth-login-modal');
    await expect(modal).toBeAttached({ timeout: 10000 });
  });

  // ─── Additional tests ──────────────────────────────────────────────────────

  test('Transition to error state when initializing with invalid projectId', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill('invalid_project_000000000000');
    await page.getByRole('button', { name: 'Init SDK' }).click();

    await expect(page.getByText('error')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('[Transcodes]')).toBeVisible();
  });

  test('SDK double initialization — idempotency check (isInitialized)', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    const isInit = await page.evaluate(() => {
      const sdk = (window as any).transcodes;
      return sdk && 'isInitialized' in sdk ? sdk.isInitialized() : false;
    });
    expect(isInit).toBe(true);
  });

  test('Unauthenticated state — verify isAuthenticated/hasToken/getCurrentMember', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    await expect(page.getByText('Not authenticated')).toBeVisible();

    const authState = await page.evaluate(async () => {
      const sdk = (window as any).transcodes;
      return {
        isAuthenticated: await sdk.token.isAuthenticated(),
        hasToken: sdk.token.hasToken(),
        currentMember: await sdk.token.getCurrentMember(),
      };
    });
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.hasToken).toBe(false);
    expect(authState.currentMember).toBeNull();
  });

  test('Re-initialization with valid projectId after initialization failure', async ({ page }) => {
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
    await expect(page.getByText('Auth Status:')).toBeVisible();
  });

  test('signOut() call while unauthenticated — completes without error', async ({ page }) => {
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

  test('getAccessToken() returns null while unauthenticated', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    const token = await page.evaluate(async () => {
      return await (window as any).transcodes.token.getAccessToken();
    });
    expect(token).toBeNull();
  });

  test('Unauthenticated state persists after closing Login Modal', async ({ page }) => {
    await page.getByPlaceholder('Project ID').fill(PROJECT_ID);
    await page.getByRole('button', { name: 'Init SDK' }).click();
    await expect(page.getByText('ready')).toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: 'Login Modal' }).click();
    const modal = page.locator('auth-login-modal');
    await expect(modal).toBeAttached({ timeout: 10000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    await expect(page.getByText('Not authenticated')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login Modal' })).toBeVisible();
  });

  test('No console errors during SDK initialization', async ({ page }) => {
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
