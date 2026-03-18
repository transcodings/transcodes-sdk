# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@bigstrider/transcodes-sdk` is the **frontend client SDK** npm package for the Transcodes platform. It is a wrapper library that enables host web applications to use features such as WebAuthn-based authentication (Passkey), RBAC IDP, audit logging, and PWA detection through the `window.transcodes` global API.

The actual SDK implementation (Dynamic SDK) is not included in this package. When `init()` is called, the project-specific `webworker.js` is dynamically loaded from the CDN (`d2xt92e3v27lcm.cloudfront.net`). This package only provides type definitions and a loader (script injection + polling).

## Build & Release

```bash
# Build (Rollup → lib/index.cjs + lib/index.esm.js + lib/types/)
npm run build

# Release (build + changeset publish)
npm run release-package
```

The package manager is **npm** (uses package-lock.json).

## Architecture

```
src/
├── index.ts      # Entry point. Re-exports all public API functions
├── loader.ts     # Core logic: init(), loadScript(), waitForTranscodes() + API wrapper functions
├── types.ts      # All TypeScript interface/type definitions
└── constants.ts  # CDN_BASE URL constant
```

- **loader.ts**: `init(projectId)` → Injects `<script type="module">` from CDN → Polls `window.transcodes` (50ms interval, 10s timeout) → Calls the Dynamic SDK's `init()`. The remaining functions (`getAccessToken`, `openAuthLoginModal`, etc.) are all thin wrappers that delegate to `window.transcodes` via the `client()` helper.
- **types.ts**: `TranscodesStaticAPI` (for the Static SDK built by the backend) and `TranscodesDynamicAPI` (runtime initialization) share a common `TranscodesBaseAPI`. `transcodes.d.ts` (root) is an auto-generated copy of these types.
- **Build output**: Rollup bundles into CJS + ESM dual formats; TypeScript declaration files are generated in `lib/types/`.

## Versioning & Release Flow

Automated version management using Changesets:
1. `npx changeset` → Record changes
2. Push to `main` or `prerelease` branch → GitHub Actions automatically creates a "Version Packages" PR
3. When the PR is merged, `npm run release-package` runs → publishes to npm

Pre-release: Enter alpha/beta mode with `npx changeset pre enter alpha|beta`.

## Code Conventions

- Code comments must be written in **Korean**
- Do not use `as` type assertions (`as const` is allowed)
- Use type-safe constants instead of magic strings

## Documentation Language Convention

Markdown documentation files (`.md`) are maintained in **English** as the primary version. Korean translations are provided as separate `.ko.md` files.

| English (primary) | Korean |
|---|---|
| `README.md` | `README.ko.md` |
| `.instruction.md` | `.instruction.ko.md` |
| `examples/README.md` | `examples/README.ko.md` |
| `examples/e2e/TEST_PLAN.md` | `examples/e2e/TEST_PLAN.ko.md` |

- When creating or updating documentation, update the **English `.md` file first**, then sync changes to the corresponding `.ko.md` file.
- `CLAUDE.md`, `CHANGELOG.md`, and `.changeset/*.md` are English-only (no Korean counterpart needed).
