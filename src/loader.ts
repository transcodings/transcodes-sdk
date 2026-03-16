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
  return `${CDN_BASE}/${projectKey}/webworker.js`;
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

  await loadScript(projectId, options?.baseUrl);
  const sdk = window.transcodes;
  if ('init' in sdk) {
    await (sdk as TranscodesDynamicAPI).init({
      projectId: projectId,
      ...options,
    });
  }
}

// ─── Token API ───────────────────────────────────────────────────────────────

export const getAccessToken = (): Promise<string | null> =>
  client().token.getAccessToken();

export const getCurrentUser = (): Promise<User | null> =>
  client().token.getCurrentUser();

export const hasToken = (): boolean => client().token.hasToken();

export const isAuthenticated = (): Promise<boolean> =>
  client().token.isAuthenticated();

export const signOut = (options?: {
  webhookNotification?: boolean;
}): Promise<void> => client().token.signOut(options);

// ─── User API ────────────────────────────────────────────────────────────────

export const getUser = (params: {
  projectId?: string;
  userId?: string;
  email?: string;
  fields?: string;
}): Promise<ApiResponse<User[]>> => client().user.get(params);

// ─── Modal API ───────────────────────────────────────────────────────────────

export const openAuthLoginModal = (params: {
  projectId?: string;
  webhookNotification?: boolean;
}): Promise<ApiResponse<AuthResult[]>> => client().openAuthLoginModal(params);

export const openAuthConsoleModal = (params?: {
  projectId?: string;
}): Promise<ApiResponse<null>> => client().openAuthConsoleModal(params);

export const openAuthAdminModal = (params: {
  projectId?: string;
  allowedRoles: string[];
}): Promise<ApiResponse<null>> => client().openAuthAdminModal(params);

export const openAuthIdpModal = (
  params: IdpOpenParams & { projectId?: string }
): Promise<ApiResponse<IdpAuthResponse[]>> => client().openAuthIdpModal(params);

// ─── Audit API ───────────────────────────────────────────────────────────────

export const trackUserAction = (
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
): Promise<void> => client().trackUserAction(event, options);

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
