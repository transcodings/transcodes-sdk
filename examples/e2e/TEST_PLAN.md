# SDK E2E Test Plan

## Existing Tests (5-6 per framework x 4 frameworks)

| # | Test Name | nextjs | sveltekit | react | vue |
|---|---------|:---:|:---:|:---:|:---:|
| 1 | Initial UI rendering | ✓ | ✓ | ✓ | ✓ |
| 2 | Init button disabled when projectId is empty | ✓ | ✓ | ✓ | ✓ |
| 3 | SDK initialization success — transition to ready state | ✓ | ✓ | ✓ | ✓ |
| 4 | Auth UI displayed after initialization | ✓ | ✓ | ✓ | ✓ |
| 5 | openAuthLoginModal — verify modal opens | ✓ | ✓ | ✓ | ✓ |
| 6 | Event log initial state check | - | - | ✓ | ✓ |
| 7 | SSR + dynamic SDK loading console error check | - | ✓ | - | - |

## Additional Tests (9 tests)

### High Priority

| # | Test Name | Target | Method | Description |
|---|---------|------|------|------|
| H1 | Invalid projectId → error state | All 4 | UI | Enter invalid ID → Click Init → `error` state + error message displayed |
| H2 | SDK double-initialization idempotency | All 4 | evaluate | After init, verify `isInitialized()` = true (initPromise memoization) |
| H3 | Unauthenticated state API check | All 4 | evaluate | `isAuthenticated()=false`, `hasToken()=false`, `getCurrentUser()=null` |
| H4 | Re-initialization after init failure | All 4 | UI | Invalid ID → error → Enter valid ID → ready (error recovery) |

### Medium Priority

| # | Test Name | Target | Method | Description |
|---|---------|------|------|------|
| M1 | signOut() without auth causes no error | All 4 | evaluate | Call `signOut()` while unauthenticated → completes without error, state preserved |
| M2 | getAccessToken() returns null | All 4 | evaluate | Call `getAccessToken()` while unauthenticated → null |
| M3 | Console Modal DOM attachment | All 4 | evaluate | Call `openAuthConsoleModal()` → custom element attached |
| M4 | State preserved after closing Login Modal | All 4 | UI+keyboard | Open modal → Escape → unauthenticated state preserved |

### Low Priority

| # | Test Name | Target | Method | Description |
|---|---------|------|------|------|
| L1 | No console errors during initialization | nextjs, react, vue | Console listener | SvelteKit already has this, add to remaining 3 |

## How to Run Tests

### All Tests

```bash
cd transcodes-sdk/examples/e2e
npm test
```

### Individual Frameworks

```bash
npm run test:nextjs
npm run test:sveltekit
npm run test:react
npm run test:vue
```

### Run Specific Tests

```bash
# Filter by test name keyword
npx playwright test --config playwright.nextjs.config.ts -g "invalid projectId"
npx playwright test --config playwright.react.config.ts -g "unauthenticated"
```

### Headed Mode (Visual Inspection)

```bash
# Default headed
npm run test:nextjs:headed

# Slow down with SLOW_MO (3-second delay between each action)
SLOW_MO=3000 npx playwright test --config playwright.nextjs.config.ts --headed -g "modal"

# Or use the /test-modal slash command (dedicated modal open test)
```

### Test Report

```bash
npm run report
```

## Implementation Patterns

### UI-Based Tests

```typescript
test('Invalid projectId → error state', async ({ page }) => {
  await page.getByPlaceholder('Project ID').fill('invalid_project_000000000000');
  await page.getByRole('button', { name: 'Init SDK' }).click();
  await expect(page.getByText('error')).toBeVisible({ timeout: 30000 });
});
```

### page.evaluate-Based Tests (Direct SDK API Calls)

```typescript
test('Unauthenticated state API check', async ({ page }) => {
  // ... init + wait for ready ...
  const state = await page.evaluate(async () => ({
    isAuthenticated: await window.transcodes.token.isAuthenticated(),
    hasToken: window.transcodes.token.hasToken(),
  }));
  expect(state.isAuthenticated).toBe(false);
  expect(state.hasToken).toBe(false);
});
```

### Console Error Collection Pattern

```typescript
test('No console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  // ... init + wait for ready ...
  expect(errors.filter(e => e.includes('[transcodes'))).toHaveLength(0);
});
```

## Notes

- Invalid projectId tests require a **30-second timeout** to account for CDN script load time
- The `auth-console-modal` selector refers to the custom element tag injected by the Dynamic SDK; verify it matches the actual DOM element name in DevTools
- `initPromise` resets to `null` on failure → retry is possible (`loader.ts:112`)
- Actual login flows requiring WebAuthn passkeys cannot be automated → tests cover only modal open/close
