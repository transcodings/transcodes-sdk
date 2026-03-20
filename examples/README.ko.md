# Transcodes SDK — 프레임워크 예제 앱

`@bigstrider/transcodes-sdk`를 4가지 프레임워크에서 통합하는 방법을 보여주는 예제 앱 모음입니다.

## 선행 작업: SDK 빌드

예제 앱은 로컬 SDK를 `file:../../` 경로로 참조합니다.
`lib/` 빌드물이 있어야 `npm install`이 성공합니다.

```bash
# 저장소 루트에서 실행
npm install
npm run build
# → lib/index.cjs, lib/index.esm.js, lib/types/ 생성 확인
```

---

## 예제 앱 실행

| 앱 | 포트 | 명령어 |
|---|---|---|
| Next.js 15 (App Router) | 9999 | `cd examples/nextjs && npm install && npm run dev` |
| SvelteKit (Svelte 5) | 9999 | `cd examples/sveltekit && npm install && npm run dev` |
| Vite + React 19 | 9999 | `cd examples/vite-react && npm install && npm run dev` |
| Vue 3 + Vite | 9999 | `cd examples/vue-vite && npm install && npm run dev` |

> 모든 예제 앱은 포트 `9999`를 공유합니다 (`constants.ts`에서 설정). 한 번에 하나만 실행하거나, E2E 테스트가 순차적으로 자동 기동합니다.

---

## E2E 테스트 실행

Playwright 기반 e2e 테스트. 각 프레임워크 테스트가 순차적으로 실행됩니다 (포트 충돌 방지).
테스트 실행 시 Playwright가 개발 서버를 자동으로 기동/종료합니다.

```bash
cd examples/e2e
npm install

# 전체 실행 (Next.js → SvelteKit → Vite+React → Vue+Vite 순서)
npm test

# 프레임워크별 개별 실행
npm run test:nextjs
npm run test:sveltekit
npm run test:react
npm run test:vue
```

### Headed 모드 (브라우저 화면 확인)

```bash
cd examples/e2e

# 전체 headed 실행
npm run test:headed

# 프레임워크별 headed 실행
npm run test:nextjs:headed
npm run test:sveltekit:headed
npm run test:react:headed
npm run test:vue:headed
```

### 슬로우 모션 (동작 확인용)

```bash
# SLOW_MO 값(ms)을 지정하면 각 액션 사이에 지연이 추가됩니다
cd examples/e2e
SLOW_MO=1000 npm run test:nextjs:headed
```

### 테스트 커버리지

| 테스트 | Next.js | SvelteKit | Vite+React | Vue+Vite |
|---|:---:|:---:|:---:|:---:|
| 초기 UI 렌더링 | ✓ | ✓ | ✓ | ✓ |
| projectId 없을 때 Init 버튼 비활성화 | ✓ | ✓ | ✓ | ✓ |
| SDK 초기화 성공 — ready 상태 전환 | ✓ | ✓ | ✓ | ✓ |
| 초기화 완료 후 인증 UI 표시 | ✓ | ✓ | ✓ | ✓ |
| openAuthLoginModal API 응답 구조 검증 | ✓ | ✓ | ✓ | ✓ |
| SSR 이후 SDK 동적 로드 (콘솔 에러 없음) | — | ✓ | — | — |
| 이벤트 로그 초기 상태 확인 | — | — | ✓ | ✓ |

> **참고:** `openAuthLoginModal` 테스트는 API 응답 구조(`success`, `payload`)만 검증합니다.
> 모달 UI가 실제로 렌더링되는지 확인하려면 프로젝트 허용 도메인에 `localhost:9999`를 추가해야 합니다.

---

## 시연 기능

각 예제에서 공통으로 확인할 수 있는 기능:

1. **Init SDK** — Project ID 입력 후 CDN에서 Dynamic SDK 로드 및 초기화 (`idle → initializing → ready`)
2. **Login Modal** — WebAuthn Passkey 인증 모달 열기
3. **Console Modal** — 인증 완료 후 사용자 콘솔 모달 열기
4. **Sign Out** — 로그아웃
5. **AUTH_STATE_CHANGED 이벤트 로그** — 인증 상태 변화 실시간 추적 (최근 10건)

---

## Project ID

[Transcodes 대시보드](https://transcodes.io)에서 프로젝트를 생성하고 Project ID를 복사하세요.

---

## 프레임워크별 SSR 처리 패턴

| 프레임워크 | 패턴 | 이유 |
|---|---|---|
| Next.js 15 | `'use client'` 경계로 SDK 코드 완전 격리 | App Router는 기본이 Server Component — `window` 접근 불가 |
| SvelteKit | `browser` 체크 + dynamic `import()` | SSR 번들에서 SDK를 완전히 제외해 `window is not defined` 방지 |
| Vite + React 19 | 정적 import, guard 불필요 | 순수 CSR — SSR 없음 |
| Vue 3 + Vite | 정적 import, guard 불필요 | 순수 CSR — SSR 없음 |
