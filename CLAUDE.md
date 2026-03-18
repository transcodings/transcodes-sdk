# CLAUDE.md

## Project Identity

`@bigstrider/transcodes-sdk` — Transcodes 플랫폼의 프론트엔드 클라이언트 SDK npm 패키지.
WebAuthn Passkey 인증, RBAC IDP, 감사 로그, PWA 감지 기능을 `window.transcodes` 글로벌 API에 위임하는 thin wrapper 라이브러리.
실제 구현체(Dynamic SDK)는 `init()` 호출 시 CDN에서 동적 로드됨 — 이 패키지는 타입 정의 + 로더만 제공.

## Commands

```bash
npm run build              # Rollup → lib/index.cjs + lib/index.esm.js + lib/types/
npm run release-package    # build + changeset publish
npx changeset              # Record a version bump (interactive)
```

Package manager: **npm** (package-lock.json). Do NOT use yarn or pnpm.

## Architecture

```
src/
├── index.ts        # Entry point — re-exports all public API from loader.ts and types
├── loader.ts       # Core logic: init(), loadScript(), waitForTranscodes(), all API wrappers
├── types.ts        # All TypeScript interfaces and type definitions
└── constants.ts    # CDN_BASE URL constant
```

- **loader.ts**: `init(projectId)` → injects `<script>` from CDN → polls `window.transcodes` (50ms intervals, 10s timeout) → calls Dynamic SDK's `init()`. API functions delegate to `window.transcodes` via `client()` (sync) or `whenReady()` (async).
- **types.ts**: `TranscodesStaticAPI` and `TranscodesDynamicAPI` share `TranscodesBaseAPI`. This is the single source of truth for all type definitions.
- **transcodes.d.ts** (root): Auto-generated copy of type declarations. When `types.ts` changes, this file must be updated to match.
- **Build output**: Rollup bundles to CJS + ESM dual format; TypeScript declarations to `lib/types/`.

### Examples & E2E

```
examples/
├── nextjs/         # Next.js 15 App Router
├── sveltekit/      # SvelteKit + Svelte 5
├── vite-react/     # Vite + React 19
├── vue-vite/       # Vue 3 + Vite
├── e2e/            # Playwright E2E tests for all example apps
├── constants.ts    # Shared project constants for examples
└── README.md       # Example app documentation
```

## Versioning & Release

Changesets-based automated versioning:
1. `npx changeset` → record change
2. Push to `main` or `prerelease` → GitHub Actions creates "Version Packages" PR
3. Merge PR → `npm run release-package` → npm publish

Pre-release: `npx changeset pre enter alpha|beta`

## Code Conventions

- Write code comments in **Korean** (코드 주석은 한국어로 작성)
- **No `as` type assertions** — `as const` is the only exception. Use type narrowing or generics instead.
- Use type-safe constants instead of magic strings
- Commit messages: **Conventional Commits** format — `type(scope): description`
  - Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`
  - Scope examples: `sdk`, `examples`, `e2e`
- In `loader.ts`: async API wrappers use `await whenReady()` pattern; sync functions (`hasToken`, `isPwaInstalled`, `on`, `off`) use `client()` directly
