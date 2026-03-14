import type {
  TranscodesEventName,
  EventCallback,
  ApiResponse,
  AuthResult,
  IdpOpenParams,
  IdpAuthResponse,
  User,
  TranscodesAPI,
} from './types';
import { CDN_BASE } from './constants';

let sdkReady: Promise<TranscodesAPI> | null = null;

function waitForTranscodes(
  projectKey: string,
  timeoutMs = 10_000
): Promise<TranscodesAPI> {
  return new Promise((resolve, reject) => {
    if (window.transcodes) {
      resolve(window.transcodes);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      if (window.transcodes) {
        clearInterval(interval);
        resolve(window.transcodes);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(
          new Error(
            `[transcodes-sdk] Timed out waiting for SDK (Project: ${projectKey})`
          )
        );
      }
    }, 50);
  });
}

function loadScript(projectKey: string): Promise<TranscodesAPI> {
  return new Promise((resolve, reject) => {
    const scriptSrc = `${CDN_BASE}/${projectKey}/webworker.js`;

    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      waitForTranscodes(projectKey).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = scriptSrc;
    script.async = true;

    script.onload = () =>
      waitForTranscodes(projectKey).then(resolve).catch(reject);
    script.onerror = () =>
      reject(new Error(`[transcodes-sdk] Failed to load script: ${scriptSrc}`));

    document.head.appendChild(script);
  });
}

async function client(): Promise<TranscodesAPI> {
  console.log('api version - 1111234');
  if (!sdkReady) {
    throw new Error('[transcodes-sdk] SDK not initialized. Call init() first.');
  }
  return sdkReady;
}

// ─── Init ────────────────────────────────────────────────────────────────────

export function init(projectId: string): Promise<TranscodesAPI> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new Error(
        '[transcodes-sdk] init() was called in a non-browser environment.'
      )
    );
  }

  if (!sdkReady) {
    sdkReady = loadScript(projectId);
  }

  return sdkReady;
}

// ─── Token API ───────────────────────────────────────────────────────────────

export const getAccessToken = async (): Promise<string | null> =>
  (await client()).token.getAccessToken();

export const getCurrentUser = async (): Promise<User | null> =>
  (await client()).token.getCurrentUser();

export const hasToken = async (): Promise<boolean> =>
  (await client()).token.hasToken();

export const isAuthenticated = async (): Promise<boolean> =>
  (await client()).token.isAuthenticated();

export const signOut = async (options?: {
  webhookNotification?: boolean;
}): Promise<void> => (await client()).token.signOut(options);

// ─── User API ────────────────────────────────────────────────────────────────

export const getUser = async (params: {
  projectId?: string;
  userId?: string;
  email?: string;
  fields?: string;
}): Promise<ApiResponse<User[]>> => (await client()).user.get(params);

// ─── Modal API ───────────────────────────────────────────────────────────────

export const openAuthLoginModal = async (params: {
  projectId?: string;
  webhookNotification?: boolean;
}): Promise<ApiResponse<AuthResult[]>> =>
  (await client()).openAuthLoginModal(params);

export const openAuthConsoleModal = async (params?: {
  projectId?: string;
}): Promise<ApiResponse<null>> => (await client()).openAuthConsoleModal(params);

export const openAuthAdminModal = async (params: {
  projectId?: string;
  allowedRoles: string[];
}): Promise<ApiResponse<null>> => (await client()).openAuthAdminModal(params);

export const openAuthIdpModal = async (
  params: IdpOpenParams & { projectId?: string }
): Promise<ApiResponse<IdpAuthResponse[]>> =>
  (await client()).openAuthIdpModal(params);

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
): Promise<void> => (await client()).trackUserAction(event, options);

// ─── PWA ─────────────────────────────────────────────────────────────────────

export const isPwaInstalled = async (): Promise<boolean> =>
  (await client()).isPwaInstalled();

// ─── Event API ───────────────────────────────────────────────────────────────

export const on = async <T extends TranscodesEventName>(
  event: T,
  callback: EventCallback<T>
): Promise<() => void> => (await client()).on(event, callback);

export const off = async <T extends TranscodesEventName>(
  event: T,
  callback: EventCallback<T>
): Promise<void> => (await client()).off(event, callback);
