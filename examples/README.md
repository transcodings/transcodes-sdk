# Transcodes SDK — Framework Example Apps

A collection of example apps demonstrating how to integrate `@bigstrider/transcodes-sdk` with 4 different frameworks.

## Prerequisite: Build the SDK

The example apps reference the local SDK via the `file:../../` path.
The `lib/` build artifacts must exist for `npm install` to succeed.

```bash
# Run from the repository root
npm install
npm run build
# → Verify lib/index.cjs, lib/index.esm.js, lib/types/ are generated
```

---

## Running Example Apps

| App | Port | Command |
|---|---|---|
| Next.js 15 (App Router) | 9999 | `cd examples/nextjs && npm install && npm run dev` |
| SvelteKit (Svelte 5) | 9999 | `cd examples/sveltekit && npm install && npm run dev` |
| Vite + React 19 | 9999 | `cd examples/vite-react && npm install && npm run dev` |
| Vue 3 + Vite | 9999 | `cd examples/vue-vite && npm install && npm run dev` |

> All example apps share port `9999` (configured in `constants.ts`). Run only one at a time, or E2E tests will handle sequential startup automatically.

---

## Running E2E Tests

Playwright-based E2E tests. Each framework test runs sequentially to avoid port conflicts.
Playwright automatically starts and stops the dev servers during test execution.

```bash
cd examples/e2e
npm install

# Run all (Next.js → SvelteKit → Vite+React → Vue+Vite in order)
npm test

# Run individually by framework
npm run test:nextjs
npm run test:sveltekit
npm run test:react
npm run test:vue
```

### Headed Mode (Visual Browser Inspection)

```bash
cd examples/e2e

# Run all in headed mode
npm run test:headed

# Run individually by framework in headed mode
npm run test:nextjs:headed
npm run test:sveltekit:headed
npm run test:react:headed
npm run test:vue:headed
```

### Slow Motion (For Visual Verification)

```bash
# Setting a SLOW_MO value (ms) adds a delay between each action
cd examples/e2e
SLOW_MO=1000 npm run test:nextjs:headed
```

### Test Coverage

| Test | Next.js | SvelteKit | Vite+React | Vue+Vite |
|---|:---:|:---:|:---:|:---:|
| Initial UI rendering | ✓ | ✓ | ✓ | ✓ |
| Init button disabled when projectId is empty | ✓ | ✓ | ✓ | ✓ |
| SDK initialization success — transition to ready state | ✓ | ✓ | ✓ | ✓ |
| Auth UI displayed after initialization | ✓ | ✓ | ✓ | ✓ |
| openAuthLoginModal API response structure validation | ✓ | ✓ | ✓ | ✓ |
| Dynamic SDK loading after SSR (no console errors) | — | ✓ | — | — |
| Event log initial state check | — | — | ✓ | ✓ |

> **Note:** The `openAuthLoginModal` test only validates the API response structure (`success`, `payload`).
> To verify that the modal UI actually renders, you must add `localhost:9999` to the project's allowed domains.

---

## Demo Features

Features that can be verified across all example apps:

1. **Init SDK** — Enter a Project ID, then load and initialize the Dynamic SDK from CDN (`idle → initializing → ready`)
2. **Login Modal** — Open the WebAuthn Passkey authentication modal
3. **Console Modal** — Open the user console modal after authentication
4. **Sign Out** — Log out
5. **AUTH_STATE_CHANGED Event Log** — Real-time tracking of auth state changes (last 10 entries)

---

## Project ID

Create a project on the [Transcodes Dashboard](https://transcodes.io) and copy the Project ID.

---

## SSR Handling Patterns by Framework

| Framework | Pattern | Reason |
|---|---|---|
| Next.js 15 | Fully isolate SDK code within `'use client'` boundary | App Router defaults to Server Components — `window` is not accessible |
| SvelteKit | `browser` check + dynamic `import()` | Completely excludes SDK from SSR bundle to prevent `window is not defined` |
| Vite + React 19 | Static import, no guard needed | Pure CSR — no SSR |
| Vue 3 + Vite | Static import, no guard needed | Pure CSR — no SSR |
