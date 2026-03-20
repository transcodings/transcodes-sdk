import type {
  TranscodesDynamicAPI,
  TranscodesInitOptions,
  TranscodesEventName,
  EventCallback,
  ApiResponse,
  AuthResult,
  IdpOpenParams,
  IdpAuthResponse,
  User,
} from './types';
import { CDN_BASE } from './constants';

let initPromise: Promise<Window['transcodes']> | null = null;

function client(): Window['transcodes'] {
  if (typeof window === 'undefined' || !window.transcodes) {
    throw new Error('[transcodes-sdk] SDK not initialized. Call init() first.');
  }
  return window.transcodes;
}

function waitForTranscodes(
  projectId: string,
  timeoutMs = 10_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.transcodes) {
      resolve();
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.transcodes) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(
          new Error(
            `[transcodes-sdk] Timed out waiting for window.transcodes (Project: ${projectId})`
          )
        );
      }
    }, 50);
  });
}

function resolveScriptSrc(projectKey: string, baseUrl?: string): string {
  // baseUrl이 지정된 경우 로컬 백엔드에서 온디맨드 컴파일 스크립트를 로드
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/v1/project/${projectKey}/webworker`;
  }
  return `${CDN_BASE}/dynamic.min.js`;
}

function loadScript(projectKey: string, baseUrl?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptSrc = resolveScriptSrc(projectKey, baseUrl);

    // 이미 스크립트가 주입된 경우: window.transcodes 준비 여부만 확인
    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      waitForTranscodes(projectKey).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    // baseUrl 지정 시(로컬 백엔드) IIFE 포맷이므로 type="module" 불필요
    script.type = baseUrl ? 'text/javascript' : 'module';
    script.src = scriptSrc;
    // onload는 파일 실행 완료를 보장하지만, webworker.js 내부의 비동기 초기화까지는
    // 보장하지 않으므로 window.transcodes 가 실제로 세팅될 때까지 폴링
    script.onload = () =>
      waitForTranscodes(projectKey).then(resolve).catch(reject);
    script.onerror = () =>
      reject(new Error(`[transcodes-sdk] Failed to load: ${scriptSrc}`));
    document.head.appendChild(script);
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

/**
 * Initializes the SDK by loading the Dynamic SDK script from CDN and calling its `init()`.
 *
 * Memoized — subsequent calls return the same promise. Resets on failure so callers can retry.
 * No-ops silently in non-browser environments (SSR safe).
 *
 * @param projectId - Transcodes project identifier
 * @param options - Optional initialization settings (e.g. `baseUrl` for local development)
 * @throws When the CDN script fails to load or `window.transcodes` does not appear within the timeout
 */
export async function init(
  projectId: string,
  options?: Omit<TranscodesInitOptions, 'projectId'>
): Promise<void> {
  // 서버 사이드 실행 방지 (SSR Safe-guard)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn(
      '[transcodes-sdk] init() was called in a non-browser environment. Skipping initialization.'
    );
    return;
  }

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      await loadScript(projectId, options?.baseUrl);
      const sdk = window.transcodes;
      if ('init' in sdk) {
        await (sdk as TranscodesDynamicAPI).init({
          projectId: projectId,
          ...options,
        });
      }
      return sdk;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  await initPromise;
}

// ─── Ready Check ────────────────────────────────────────────────────────────

/**
 * Returns the initialization promise, allowing callers to await SDK readiness.
 *
 * @returns The promise created by {@link init}
 * @throws When `init()` has not been called yet
 */
export function whenReady(): Promise<Window['transcodes']> {
  if (!initPromise) {
    return Promise.reject(
      new Error('[transcodes-sdk] init() has not been called yet.')
    );
  }
  return initPromise;
}

/** SSR-safe check of whether the SDK has been initialized. Returns `false` on the server. */
export function isInitialized(): boolean {
  if (typeof window === 'undefined' || !window.transcodes) return false;
  if ('isInitialized' in window.transcodes) {
    return (window.transcodes as TranscodesDynamicAPI).isInitialized();
  }
  return true;
}

// ─── Token API ───────────────────────────────────────────────────────────────

/** Gets the current access token, or `null` if the user is not authenticated. */
export const getAccessToken = async (): Promise<string | null> =>
  (await whenReady()).token.getAccessToken();

/** Gets the currently authenticated user, or `null` if no user is signed in. */
export const getCurrentUser = async (): Promise<User | null> =>
  (await whenReady()).token.getCurrentUser();

/**
 * Synchronously checks if a token exists.
 *
 * @throws When the SDK is not initialized
 */
export const hasToken = (): boolean => client().token.hasToken();

/** Checks if the user is currently authenticated. */
export const isAuthenticated = async (): Promise<boolean> =>
  (await whenReady()).token.isAuthenticated();

/** Signs out the current user and clears the session. */
export const signOut = async (options?: {
  webhookNotification?: boolean;
}): Promise<void> =>
  (await whenReady()).token.signOut(options);

// ─── User API ────────────────────────────────────────────────────────────────

/** Fetches user(s) matching the given query parameters. */
export const getUser = async (params: {
  projectId?: string;
  userId?: string;
  email?: string;
  fields?: string;
}): Promise<ApiResponse<User[]>> =>
  (await whenReady()).user.get(params);

// ─── Modal API ───────────────────────────────────────────────────────────────

/** Opens the login authentication modal for WebAuthn Passkey sign-in. */
export const openAuthLoginModal = async (params: {
  projectId?: string;
  webhookNotification?: boolean;
}): Promise<ApiResponse<AuthResult[]>> =>
  (await whenReady()).openAuthLoginModal(params);

/** Opens the auth console modal for account management. */
export const openAuthConsoleModal = async (params?: {
  projectId?: string;
}): Promise<ApiResponse<null>> =>
  (await whenReady()).openAuthConsoleModal(params);

/** Opens the admin authentication modal with role-based access control. */
export const openAuthAdminModal = async (params: {
  projectId?: string;
  allowedRoles: string[];
}): Promise<ApiResponse<null>> =>
  (await whenReady()).openAuthAdminModal(params);

/** Opens the IDP authentication modal for RBAC step-up verification. */
export const openAuthIdpModal = async (
  params: IdpOpenParams & { projectId?: string }
): Promise<ApiResponse<IdpAuthResponse[]>> =>
  (await whenReady()).openAuthIdpModal(params);

// ─── Audit API ───────────────────────────────────────────────────────────────

/** Tracks a user action for audit logging. */
export const trackUserAction = async (
  event: {
    tag: string;
    severity?: 'low' | 'medium' | 'high';
    status?: boolean;
    error?: string;
    metadata?: Record<string, unknown>;
    page?: string;
  },
  options?: {
    requireAuth?: boolean;
    webhookNotification?: boolean;
  }
): Promise<void> =>
  (await whenReady()).trackUserAction(event, options);

// ─── PWA ─────────────────────────────────────────────────────────────────────

/**
 * Synchronously checks if the app is installed as a PWA.
 *
 * @throws When the SDK is not initialized
 */
export const isPwaInstalled = (): boolean => client().isPwaInstalled();

// ─── Event API ───────────────────────────────────────────────────────────────

/**
 * Subscribes to an SDK event.
 *
 * @param event - Event name to listen for
 * @param callback - Handler invoked when the event fires
 * @returns An unsubscribe function that removes the listener
 * @throws When the SDK is not initialized
 */
export const on = <T extends TranscodesEventName>(
  event: T,
  callback: EventCallback<T>
): (() => void) => client().on(event, callback);

/**
 * Unsubscribes from an SDK event.
 *
 * @param event - Event name to stop listening for
 * @param callback - The same handler reference passed to {@link on}
 * @throws When the SDK is not initialized
 */
export const off = <T extends TranscodesEventName>(
  event: T,
  callback: EventCallback<T>
): void => client().off(event, callback);
