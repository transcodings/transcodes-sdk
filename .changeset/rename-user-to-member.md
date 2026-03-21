---
"@bigstrider/transcodes-sdk": major
---

### BREAKING CHANGE: `User` → `Member` domain term rename

The Transcodes platform distinguishes three identity types:

- **User** — A Transcodes dashboard user authenticated via Firebase Auth (the customer's developer/admin)
- **Collaborator** — A team member invited to an Organization
- **Member** — An end-user within a Project, authenticated via WebAuthn Passkey (the customer's service user)

The SDK operates on **Members** (project-level end-users). The previous `User` naming caused confusion with dashboard-level Users, so all SDK APIs now use `Member` to align with the domain model.

#### Migration guide

| Before | After |
|--------|-------|
| `import type { User }` | `import type { Member }` |
| `getCurrentUser()` | `getCurrentMember()` |
| `getUser(params)` | `getMember(params)` |
| `result.payload[0].user` | `result.payload[0].member` |
| `payload.user` (AUTH_STATE_CHANGED) | `payload.member` |
| `window.transcodes.user.get()` | `window.transcodes.member.get()` |
| `{ userId }` param | `{ memberId }` param |
| `{ customUserId }` in init/setConfig | `{ memberId }` in init/setConfig |

#### Other changes

- Add `getBuildInfo()` method and `TranscodesBuildInfo` interface
- Add `createdAt`, `updatedAt` fields to `Member` interface
