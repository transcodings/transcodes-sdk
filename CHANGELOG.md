# @bigstrider/transcodes-sdk

## 1.1.0

### Minor Changes

- 4c4e4c3: Corrected package.json esm & cjs export
- 61ce26c: added env variables for dev

## 1.0.0

### Major Changes

- 5fe564f: ### BREAKING CHANGE: `User` → `Member` domain term rename

  The Transcodes platform distinguishes three identity types:

  - **User** — A Transcodes dashboard user authenticated via Firebase Auth (the customer's developer/admin)
  - **Collaborator** — A team member invited to an Organization
  - **Member** — An end-user within a Project, authenticated via WebAuthn Passkey (the customer's service user)

  The SDK operates on **Members** (project-level end-users). The previous `User` naming caused confusion with dashboard-level Users, so all SDK APIs now use `Member` to align with the domain model.

  #### Migration guide

  | Before                               | After                            |
  | ------------------------------------ | -------------------------------- |
  | `import type { User }`               | `import type { Member }`         |
  | `getCurrentUser()`                   | `getCurrentMember()`             |
  | `getUser(params)`                    | `getMember(params)`              |
  | `result.payload[0].user`             | `result.payload[0].member`       |
  | `payload.user` (AUTH_STATE_CHANGED)  | `payload.member`                 |
  | `window.transcodes.user.get()`       | `window.transcodes.member.get()` |
  | `{ userId }` param                   | `{ memberId }` param             |
  | `{ customUserId }` in init/setConfig | `{ memberId }` in init/setConfig |

  #### Other changes

  - Add `getBuildInfo()` method and `TranscodesBuildInfo` interface
  - Add `createdAt`, `updatedAt` fields to `Member` interface

### Minor Changes

- f50e383: - Add `baseUrl` option to `init()`: allows loading the toolkit script from a local backend instead of the CDN
  - Centralize example app port/URL constants into `examples/constants.ts`
  - Improve e2e tests to verify modal opening (DOM appearance)

### Patch Changes

- bc0fe9b: docs: add TSDoc comments to all exported symbols for improved IDE documentation

## 0.3.0

### Minor Changes

- f50e383: init()에 baseUrl 옵션 추가: CDN 대신 로컬 백엔드에서 toolkit 스크립트를 로드할 수 있도록 지원. 예제 앱 포트/URL 상수를 examples/constants.ts로 중앙화하고, e2e 테스트에서 모달 열림(DOM 출현)을 검증하도록 개선.

### Patch Changes

- b686b5f: fix: use dynamic SDK script (dynamic.min.js) instead of static webworker.js to resolve initialization issues

## 0.2.0

### Minor Changes

- 4752254: added first functions lineup

### Patch Changes

- a903643: fixed package-lock
