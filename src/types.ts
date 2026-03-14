declare global {
  interface Window {
    transcodes: TranscodesAPI;
  }

  var transcodes: Window['transcodes'];

  interface Navigator {
    getInstalledRelatedApps?: () => Promise<
      {
        id?: string;
        platform: string;
        url?: string;
      }[]
    >;
  }

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

export const TranscodesEventNames = {
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ERROR: 'ERROR',
} as const;

export type TranscodesEventName =
  (typeof TranscodesEventNames)[keyof typeof TranscodesEventNames];

export type EventCallback<T extends TranscodesEventName> = (
  payload: TranscodesEventMap[T]
) => void;

export type TranscodesAPI = TranscodesStaticAPI | TranscodesDynamicAPI;

export interface TranscodesStaticAPI extends TranscodesBaseAPI {
  showMessage: (message: string) => void;
}

export interface TranscodesDynamicAPI extends TranscodesBaseAPI {
  init: (options: TranscodesInitOptions) => Promise<void>;
  setConfig: (options: { customUserId?: string }) => void;
  isInitialized: () => boolean;
}

export interface TranscodesBaseAPI {
  token: TokenAPI;
  user: PublicUserAPI;
  on: PublicEventAPI['on'];
  off: PublicEventAPI['off'];
  openAuthLoginModal: (params: {
    projectId?: string;
    webhookNotification?: boolean;
  }) => Promise<ApiResponse<AuthResult[]>>;
  openAuthConsoleModal: (params?: {
    projectId?: string;
  }) => Promise<ApiResponse<null>>;
  openAuthAdminModal: (params: {
    projectId?: string;
    allowedRoles: string[];
  }) => Promise<ApiResponse<null>>;
  openAuthIdpModal: (
    params: IdpOpenParams & { projectId?: string }
  ) => Promise<ApiResponse<IdpAuthResponse[]>>;
  trackUserAction: (
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
  ) => Promise<void>;
  isPwaInstalled: () => boolean;
}

export interface TranscodesInitOptions {
  projectId: string;
  /** @deprecated Server derives rpId from project domain_url. */
  rpid?: string;
  customUserId?: string;
  debug?: boolean;
}

export interface TokenAPI {
  getCurrentUser(): Promise<User | null>;
  getAccessToken(): Promise<string | null>;
  hasToken(): boolean;
  isAuthenticated(): Promise<boolean>;
  signOut(options?: { webhookNotification?: boolean }): Promise<void>;
}

export interface PublicUserAPI {
  get(params: {
    projectId?: string;
    userId?: string;
    email?: string;
    fields?: string;
  }): Promise<ApiResponse<User[]>>;
}

export interface PublicEventAPI {
  on<T extends TranscodesEventName>(
    event: T,
    callback: EventCallback<T>
  ): () => void;
  off<T extends TranscodesEventName>(
    event: T,
    callback: EventCallback<T>
  ): void;
}

export interface ApiResponse<T> {
  success: boolean;
  payload: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface IdpOpenParams {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  forceStepUp?: boolean;
  webhookNotification?: boolean;
}

export interface IdpAuthResponse {
  success: boolean;
  sid?: string;
  error?: string;
  timestamp: number;
  action?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  projectId: string;
  metadata?: {
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface TranscodesEventMap {
  AUTH_STATE_CHANGED: AuthStateChangedPayload;
  TOKEN_REFRESHED: TokenRefreshedPayload;
  TOKEN_EXPIRED: TokenExpiredPayload;
  ERROR: ErrorPayload;
}

export interface AuthStateChangedPayload {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  user: User | null;
}

export interface TokenRefreshedPayload {
  accessToken: string;
  expiresAt: number;
}

export interface TokenExpiredPayload {
  expiredAt: number;
}

export interface ErrorPayload {
  code: string;
  message: string;
  context?: string;
}
