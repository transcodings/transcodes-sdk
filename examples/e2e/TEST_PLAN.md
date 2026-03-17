# SDK E2E 테스트 계획

## 기존 테스트 (5~6개 × 4 프레임워크)

| # | 테스트명 | nextjs | sveltekit | react | vue |
|---|---------|:---:|:---:|:---:|:---:|
| 1 | 초기 UI 렌더링 | ✓ | ✓ | ✓ | ✓ |
| 2 | projectId 없을 때 Init 버튼 비활성화 | ✓ | ✓ | ✓ | ✓ |
| 3 | SDK 초기화 성공 — ready 상태 전환 | ✓ | ✓ | ✓ | ✓ |
| 4 | 초기화 완료 후 인증 UI 표시 | ✓ | ✓ | ✓ | ✓ |
| 5 | openAuthLoginModal — 모달 열림 확인 | ✓ | ✓ | ✓ | ✓ |
| 6 | 이벤트 로그 초기 상태 확인 | - | - | ✓ | ✓ |
| 7 | SSR + dynamic SDK 로딩 콘솔 에러 확인 | - | ✓ | - | - |

## 추가 테스트 (9개)

### High Priority

| # | 테스트명 | 대상 | 방식 | 설명 |
|---|---------|------|------|------|
| H1 | 잘못된 projectId → error 상태 | 4개 전체 | UI | invalid ID 입력 → Init 클릭 → `error` 상태 + 에러 메시지 표시 |
| H2 | SDK 이중 초기화 멱등성 | 4개 전체 | evaluate | init 후 `isInitialized()` = true 확인 (initPromise 메모이제이션) |
| H3 | 미인증 상태 API 확인 | 4개 전체 | evaluate | `isAuthenticated()=false`, `hasToken()=false`, `getCurrentUser()=null` |
| H4 | 초기화 실패 후 재초기화 | 4개 전체 | UI | invalid ID → error → valid ID 입력 → ready (에러 복구) |

### Medium Priority

| # | 테스트명 | 대상 | 방식 | 설명 |
|---|---------|------|------|------|
| M1 | 미인증 signOut() 무에러 | 4개 전체 | evaluate | 미인증에서 `signOut()` → 에러 없이 완료, 상태 유지 |
| M2 | getAccessToken() null 반환 | 4개 전체 | evaluate | 미인증에서 `getAccessToken()` → null |
| M3 | Console Modal DOM 추가 | 4개 전체 | evaluate | `openAuthConsoleModal()` 호출 → 커스텀 엘리먼트 attached |
| M4 | Login Modal 닫기 후 상태 유지 | 4개 전체 | UI+키보드 | 모달 열기 → Escape → 미인증 상태 유지 |

### Low Priority

| # | 테스트명 | 대상 | 방식 | 설명 |
|---|---------|------|------|------|
| L1 | 초기화 중 콘솔 에러 없음 | nextjs, react, vue | 콘솔 리스너 | SvelteKit은 이미 있으므로 나머지 3개에 추가 |

## 테스트 실행 방법

### 전체 테스트

```bash
cd transcodes-sdk/examples/e2e
npm test
```

### 개별 프레임워크

```bash
npm run test:nextjs
npm run test:sveltekit
npm run test:react
npm run test:vue
```

### 특정 테스트만 실행

```bash
# 테스트명 키워드로 필터
npx playwright test --config playwright.nextjs.config.ts -g "잘못된 projectId"
npx playwright test --config playwright.react.config.ts -g "미인증"
```

### Headed 모드 (육안 확인)

```bash
# 기본 headed
npm run test:nextjs:headed

# SLOW_MO로 느리게 (각 액션 사이 3초 딜레이)
SLOW_MO=3000 npx playwright test --config playwright.nextjs.config.ts --headed -g "모달"

# 또는 /test-modal 슬래시 커맨드 사용 (모달 열림 테스트 전용)
```

### 테스트 리포트

```bash
npm run report
```

## 구현 패턴

### UI 기반 테스트

```typescript
test('잘못된 projectId → error 상태', async ({ page }) => {
  await page.getByPlaceholder('Project ID').fill('invalid_project_000000000000');
  await page.getByRole('button', { name: 'Init SDK' }).click();
  await expect(page.getByText('error')).toBeVisible({ timeout: 30000 });
});
```

### page.evaluate 기반 테스트 (SDK API 직접 호출)

```typescript
test('미인증 상태 API 확인', async ({ page }) => {
  // ... init + ready 대기 ...
  const state = await page.evaluate(async () => ({
    isAuthenticated: await window.transcodes.token.isAuthenticated(),
    hasToken: window.transcodes.token.hasToken(),
  }));
  expect(state.isAuthenticated).toBe(false);
  expect(state.hasToken).toBe(false);
});
```

### 콘솔 에러 수집 패턴

```typescript
test('콘솔 에러 없음', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  // ... init + ready 대기 ...
  expect(errors.filter(e => e.includes('[transcodes'))).toHaveLength(0);
});
```

## 주의사항

- invalid projectId 테스트는 CDN 스크립트 로드 시간 포함 **30초 타임아웃** 필요
- `auth-console-modal` 태그명은 실제 DOM에서 확인 후 조정 가능
- `initPromise`는 실패 시 `null`로 리셋 → 재시도 가능 (`loader.ts:112`)
- WebAuthn passkey가 필요한 실제 로그인 플로우는 자동화 불가 → 모달 열림/닫기까지만 테스트
