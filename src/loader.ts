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
  // If baseUrl is specified, load the on-demand compiled script from the local backend
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/v1/project/${projectKey}/webworker`;
  }
  return `${CDN_BASE}/dynamic.min.js`;
}

function loadScript(projectKey: string, baseUrl?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptSrc = resolveScriptSrc(projectKey, baseUrl);

    // Script already injected: just wait for window.transcodes to be ready
    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      waitForTranscodes(projectKey).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    // When baseUrl is set (local backend), the script is IIFE format so type="module" is unnecessary
    script.type = baseUrl ? 'text/javascript' : 'module';
    script.src = scriptSrc;
    // onload guarantees the file has executed, but not that webworker.js has finished
    // its async initialization, so poll until window.transcodes is actually set
    script.onload = () =>
      waitForTranscodes(projectKey).then(resolve).catch(reject);
    script.onerror = () =>
      reject(new Error(`[transcodes-sdk] Failed to load: ${scriptSrc}`));
    document.head.appendChild(script);
  });
}

// ─── Init ────────────────────────────────────────────────────────────────────

export async function init(
  projectId: string,
  options?: Omit<TranscodesInitOptions, 'projectId'>
): Promise<void> {
  // Prevent server-side execution (SSR safeguard)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn(
      '[transcodes-sdk] init() was called in a server-side environment. Skipping initialization.'
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

export function whenReady(): Promise<Window['transcodes']> {
  if (!initPromise) {
    return Promise.reject(
      new Error('[transcodes-sdk] init() has not been called yet.')
    );
  }
  return initPromise;
}

export function isInitialized(): boolean {
  if (typeof window === 'undefined' || !window.transcodes) return false;
  if ('isInitialized' in window.transcodes) {
    return (window.transcodes as TranscodesDynamicAPI).isInitialized();
  }
  return true;
}

// ─── Token API ───────────────────────────────────────────────────────────────

export const getAccessToken = async (): Promise<string | null> =>
  (await whenReady()).token.getAccessToken();

export const getCurrentUser = async (): Promise<User | null> =>
  (await whenReady()).token.getCurrentUser();

export const hasToken = (): boolean => client().token.hasToken();

export const isAuthenticated = async (): Promise<boolean> =>
  (await whenReady()).token.isAuthenticated();

export const signOut = async (options?: {
  webhookNotification?: boolean;
}): Promise<void> =>
  (await whenReady()).token.signOut(options);

// ─── User API ────────────────────────────────────────────────────────────────

export const getUser = async (params: {
  projectId?: string;
  userId?: string;
  email?: string;
  fields?: string;
}): Promise<ApiResponse<User[]>> =>
  (await whenReady()).user.get(params);

// ─── Modal API ───────────────────────────────────────────────────────────────

export const openAuthLoginModal = async (params: {
  projectId?: string;
  webhookNotification?: boolean;
}): Promise<ApiResponse<AuthResult[]>> =>
  (await whenReady()).openAuthLoginModal(params);

export const openAuthConsoleModal = async (params?: {
  projectId?: string;
}): Promise<ApiResponse<null>> =>
  (await whenReady()).openAuthConsoleModal(params);

export const openAuthAdminModal = async (params: {
  projectId?: string;
  allowedRoles: string[];
}): Promise<ApiResponse<null>> =>
  (await whenReady()).openAuthAdminModal(params);

export const openAuthIdpModal = async (
  params: IdpOpenParams & { projectId?: string }
): Promise<ApiResponse<IdpAuthResponse[]>> =>
  (await whenReady()).openAuthIdpModal(params);

// ─── Audit API ───────────────────────────────────────────────────────────────

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

export const isPwaInstalled = (): boolean => client().isPwaInstalled();

// ─── Event API ───────────────────────────────────────────────────────────────

export const on = <T extends TranscodesEventName>(
  event: T,
  callback: EventCallback<T>
): (() => void) => client().on(event, callback);

export const off = <T extends TranscodesEventName>(
  event: T,
  callback: EventCallback<T>
): void => client().off(event, callback);
