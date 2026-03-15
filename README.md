# @bigstrider/transcodes-sdk

Transcodes 플랫폼의 프론트엔드 클라이언트 SDK입니다. WebAuthn Passkey 인증, RBAC IDP, 감사 로그, PWA 감지 기능을 호스트 웹앱에서 간단하게 사용할 수 있도록 하는 래퍼 라이브러리입니다.

실제 SDK 구현체(Dynamic SDK)는 `init()` 호출 시 CDN에서 프로젝트별 스크립트를 동적으로 로드합니다. 이 패키지는 **타입 정의와 로더(script injection + polling)** 만 포함합니다.

## 설치

```bash
npm install @bigstrider/transcodes-sdk
```

## 빠른 시작

```typescript
import { init, openAuthLoginModal, on } from '@bigstrider/transcodes-sdk';

// 1. 초기화 (CDN에서 Dynamic SDK 로드)
await init('YOUR_PROJECT_ID');

// 2. 로그인 모달 열기
const result = await openAuthLoginModal({ webhookNotification: false });
if (result.success) {
  console.log('로그인 성공:', result.payload[0].user);
}

// 3. 인증 상태 변화 구독
const unsubscribe = on('AUTH_STATE_CHANGED', ({ isAuthenticated, user }) => {
  console.log('인증 상태:', isAuthenticated, user);
});

// 4. 구독 해제
unsubscribe();
```

---

## API

### `init(projectId, options?)`

CDN에서 프로젝트별 Dynamic SDK를 로드하고 초기화합니다.
SSR 환경에서 호출 시 자동으로 스킵됩니다.

```typescript
await init('YOUR_PROJECT_ID');
await init('YOUR_PROJECT_ID', { customUserId: 'user-123', debug: true });
```

| 옵션 | 타입 | 설명 |
|---|---|---|
| `customUserId` | `string` | 인증 사용자에게 연결할 외부 사용자 ID |
| `debug` | `boolean` | 디버그 로그 활성화 |

---

### 인증 모달

```typescript
// 로그인 (WebAuthn Passkey)
const result = await openAuthLoginModal({ webhookNotification: false });
// result: ApiResponse<AuthResult[]>

// 사용자 콘솔 (인증 완료 후)
await openAuthConsoleModal();

// 어드민 콘솔 (RBAC 역할 검사 포함)
await openAuthAdminModal({ allowedRoles: ['admin', 'manager'] });

// IDP 인증 모달 (RBAC 리소스 접근)
await openAuthIdpModal({ resource: 'invoice', action: 'read' });
```

---

### 토큰 / 사용자

```typescript
const isLoggedIn = await isAuthenticated();   // boolean
const user = await getCurrentUser();          // User | null
const token = await getAccessToken();         // string | null
const hasSession = hasToken();                // boolean (동기)

await signOut({ webhookNotification: false });
```

---

### 사용자 조회

```typescript
const res = await getUser({ email: 'user@example.com' });
// res: ApiResponse<User[]>
```

---

### 이벤트 구독

`on()` 은 unsubscribe 함수를 반환합니다.

```typescript
const unsubscribe = on('AUTH_STATE_CHANGED', (payload) => {
  // payload: { isAuthenticated, accessToken, expiresAt, user }
});

on('TOKEN_REFRESHED', ({ accessToken, expiresAt }) => { ... });
on('TOKEN_EXPIRED', ({ expiredAt }) => { ... });
on('ERROR', ({ code, message }) => { ... });

// 구독 해제
unsubscribe();
// 또는
off('AUTH_STATE_CHANGED', callback);
```

| 이벤트 | payload 타입 |
|---|---|
| `AUTH_STATE_CHANGED` | `AuthStateChangedPayload` |
| `TOKEN_REFRESHED` | `TokenRefreshedPayload` |
| `TOKEN_EXPIRED` | `TokenExpiredPayload` |
| `ERROR` | `ErrorPayload` |

---

### 감사 로그

```typescript
await trackUserAction(
  { tag: 'export_report', severity: 'medium', status: true },
  { requireAuth: true, webhookNotification: true }
);
```

---

### PWA

```typescript
const installed = isPwaInstalled(); // boolean
```

---

## 프레임워크별 사용 패턴

### Next.js 15 (App Router)

SDK는 `window`를 사용하므로 `'use client'` 컴포넌트 안에서만 호출해야 합니다.

```typescript
// components/TranscodesDemo.tsx
'use client';
import { useEffect, useRef } from 'react';
import { init, on } from '@bigstrider/transcodes-sdk';

export function TranscodesDemo() {
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // init은 컴포넌트 내부에서 호출 — Server Component에서 호출하면 안 됨
    unsubRef.current = on('AUTH_STATE_CHANGED', (payload) => {
      console.log(payload);
    });
    return () => unsubRef.current?.();
  }, []);
  // ...
}
```

### SvelteKit (Svelte 5)

SSR 환경에서는 `browser` 조건 + dynamic import로 SDK를 제외합니다.

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';

  let unsubscribe: (() => void) | null = null;

  async function initSdk() {
    if (!browser) return;
    const sdk = await import('@bigstrider/transcodes-sdk');
    await sdk.init('YOUR_PROJECT_ID');
    unsubscribe = sdk.on('AUTH_STATE_CHANGED', (payload) => {
      console.log(payload);
    });
  }

  onDestroy(() => unsubscribe?.());
</script>
```

### React (Vite / CRA)

순수 CSR이므로 정적 import 그대로 사용합니다.

```typescript
import { useEffect, useRef } from 'react';
import { init, on } from '@bigstrider/transcodes-sdk';

function App() {
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    init('YOUR_PROJECT_ID').then(() => {
      unsubRef.current = on('AUTH_STATE_CHANGED', console.log);
    });
    return () => unsubRef.current?.();
  }, []);
}
```

### Vue 3 (Vite)

```typescript
// composables/useTranscodes.ts
import { onUnmounted } from 'vue';
import { init, on } from '@bigstrider/transcodes-sdk';

export function useTranscodes() {
  let unsubscribe: (() => void) | null = null;

  async function initSdk(projectId: string) {
    await init(projectId);
    unsubscribe = on('AUTH_STATE_CHANGED', console.log);
  }

  onUnmounted(() => unsubscribe?.());
  return { initSdk };
}
```

---

## 타입

```typescript
interface ApiResponse<T> {
  success: boolean;
  payload: T;
  error?: string;
  message?: string;
  status?: number;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  projectId: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

interface AuthResult {
  token: string;
  user: User;
}
```

전체 타입은 `src/types.ts` 또는 설치 후 `node_modules/@bigstrider/transcodes-sdk/lib/types/` 를 참고하세요.

---

## 예제 앱

4가지 프레임워크 통합 예제는 [`examples/`](./examples/README.md) 디렉토리를 참고하세요.

---

## 라이선스

MIT
