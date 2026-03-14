# @bigstrider/transcodes-sdk

Frontend SDK for Transcodes authentication and identity services.

## Installation

```bash
npm install @bigstrider/transcodes-sdk
```

## Setup

### 1. Add manifest link (for PWA support)

Add the manifest link to your `index.html` **before** using the SDK:

```html
<link rel="manifest" href="https://d2xt92e3v27lcm.cloudfront.net/YOUR_PROJECT_ID/manifest.json" />
```

Replace `YOUR_PROJECT_ID` with your project key from the Transcodes dashboard.

### 2. Initialize the SDK

Call `init()` before using any other API. This loads the SDK script and configures it.

```typescript
import { init } from '@bigstrider/transcodes-sdk';

await init('YOUR_PROJECT_ID');
```

With optional config:

```typescript
await init('YOUR_PROJECT_ID', {
  customUserId: 'firebase-uid-123',  // Optional: for external auth integration
  debug: true,                        // Optional: enable debug logging
});
```

---

## API Reference

### Token API

| Function | Description |
|----------|-------------|
| `getAccessToken()` | Returns the current access token, or `null` if not authenticated |
| `getCurrentUser()` | Returns the authenticated user, or `null` |
| `hasToken()` | Synchronously checks if a token exists in memory |
| `isAuthenticated()` | Returns `true` if the user is authenticated |
| `signOut(options?)` | Logs out the user. Pass `{ webhookNotification: true }` for Slack alerts |

```typescript
import { getAccessToken, getCurrentUser, signOut } from '@bigstrider/transcodes-sdk';

const token = await getAccessToken();
const user = await getCurrentUser();

if (user) {
  console.log(user.email, user.name);
}

await signOut();
```

### User API

| Function | Description |
|----------|-------------|
| `getUser(params)` | Fetches user(s) by `projectId`, `userId`, `email`, or `fields` |

```typescript
import { getUser } from '@bigstrider/transcodes-sdk';

const { success, payload } = await getUser({ email: 'user@example.com' });
```

### Modal API

| Function | Description |
|----------|-------------|
| `openAuthLoginModal(params)` | Opens the login modal |
| `openAuthConsoleModal(params?)` | Opens the auth console |
| `openAuthAdminModal(params)` | Opens the admin modal (requires `allowedRoles`) |
| `openAuthIdpModal(params)` | Opens the IDP modal for step-up auth (RBAC) |

```typescript
import {
  openAuthLoginModal,
  openAuthAdminModal,
  openAuthIdpModal,
} from '@bigstrider/transcodes-sdk';

// Login
const { success, payload } = await openAuthLoginModal();

// Admin (role-gated)
await openAuthAdminModal({
  allowedRoles: ['admin', 'superadmin'],
});

// Step-up auth (RBAC)
await openAuthIdpModal({
  resource: 'users',
  action: 'delete',
  forceStepUp: false,
});
```

### Audit API

| Function | Description |
|----------|-------------|
| `trackUserAction(event, options?)` | Logs user actions for audit |

```typescript
import { trackUserAction } from '@bigstrider/transcodes-sdk';

await trackUserAction(
  {
    tag: 'user:login',
    severity: 'low',
    status: true,
    metadata: { method: 'passkey' },
  },
  { requireAuth: false }
);
```

### PWA

| Function | Description |
|----------|-------------|
| `isPwaInstalled()` | Returns `true` if the app is installed as a PWA |

```typescript
import { isPwaInstalled } from '@bigstrider/transcodes-sdk';

if (!isPwaInstalled()) {
  // Show install button
}
```

### Events

| Function | Description |
|----------|-------------|
| `on(event, callback)` | Subscribes to an event. Returns an unsubscribe function |
| `off(event, callback)` | Unsubscribes from an event |

**Event names** (use `TranscodesEventNames`):

- `AUTH_STATE_CHANGED` — Login/logout
- `TOKEN_REFRESHED` — Access token refreshed
- `TOKEN_EXPIRED` — Token expired
- `ERROR` — SDK error

```typescript
import { on, off, TranscodesEventNames } from '@bigstrider/transcodes-sdk';

const unsubscribe = on(TranscodesEventNames.AUTH_STATE_CHANGED, (payload) => {
  console.log('Auth changed:', payload.isAuthenticated, payload.user);
});

// Later
unsubscribe();
// or: off(TranscodesEventNames.AUTH_STATE_CHANGED, callback);
```

---

## Complete Example

```typescript
import {
  init,
  getCurrentUser,
  openAuthLoginModal,
  signOut,
  on,
  TranscodesEventNames,
} from '@bigstrider/transcodes-sdk';

async function bootstrap() {
  await init('YOUR_PROJECT_ID');

  on(TranscodesEventNames.AUTH_STATE_CHANGED, ({ isAuthenticated, user }) => {
    console.log(isAuthenticated ? `Logged in: ${user?.email}` : 'Logged out');
  });

  const user = await getCurrentUser();
  if (!user) {
    const { success } = await openAuthLoginModal();
    if (!success) return;
  }

  // ... your app logic
}

bootstrap();
```

---

## License

MIT
