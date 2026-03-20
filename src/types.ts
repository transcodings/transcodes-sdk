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

/** Constant object mapping event name keys to their string values. */
export const TranscodesEventNames = {
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ERROR: 'ERROR',
} as const;

/** Union type of all valid SDK event name strings. */
export type TranscodesEventName =
  (typeof TranscodesEventNames)[keyof typeof TranscodesEventNames];

/**
 * Callback function type for SDK event listeners, typed by event name.
 *
 * @param payload - The event-specific payload corresponding to the event name.
 */
export type EventCallback<T extends TranscodesEventName> = (
  payload: TranscodesEventMap[T]
) => void;

/** Union of static and dynamic SDK API surfaces exposed on `window.transcodes`. */
export type TranscodesAPI = TranscodesStaticAPI | TranscodesDynamicAPI;

/** API surface for the static (pre-init) SDK loaded from CDN. */
export interface TranscodesStaticAPI extends TranscodesBaseAPI {
  showMessage: (message: string) => void;
}

/** API surface for the fully initialized Dynamic SDK. */
export interface TranscodesDynamicAPI extends TranscodesBaseAPI {
  init: (options: TranscodesInitOptions) => Promise<void>;
  setConfig: (options: { customUserId?: string }) => void;
  isInitialized: () => boolean;
}

/** Shared API methods available in both static and dynamic SDK modes. */
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

/** Configuration options for SDK initialization. */
export interface TranscodesInitOptions {
  projectId: string;
  /** @deprecated Server derives rpId from project domain_url. */
  rpId?: string;
  customUserId?: string;
  debug?: boolean;
}

/** Token management API for authentication state. */
export interface TokenAPI {
  getCurrentUser(): Promise<User | null>;
  getAccessToken(): Promise<string | null>;
  hasToken(): boolean;
  isAuthenticated(): Promise<boolean>;
  signOut(options?: { webhookNotification?: boolean }): Promise<void>;
}

/** Public API for querying user records. */
export interface PublicUserAPI {
  get(params: {
    projectId?: string;
    userId?: string;
    email?: string;
    fields?: string;
  }): Promise<ApiResponse<User[]>>;
}

/** Event subscription API for SDK lifecycle events. */
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

/** Standard API response wrapper with success/error status. */
export interface ApiResponse<T> {
  success: boolean;
  payload: T;
  error?: string;
  message?: string;
  status?: number;
}

/** Authentication result containing token and user data. */
export interface AuthResult {
  token: string;
  user: User;
}

/** Parameters for opening the IDP authorization modal. */
export interface IdpOpenParams {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  forceStepUp?: boolean;
  webhookNotification?: boolean;
}

/** Response from an IDP authorization request. */
export interface IdpAuthResponse {
  success: boolean;
  sid?: string;
  error?: string;
  timestamp: number;
  action?: string;
}

/** Represents a Transcodes platform user. */
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

/** Maps event names to their corresponding payload types. */
export interface TranscodesEventMap {
  AUTH_STATE_CHANGED: AuthStateChangedPayload;
  TOKEN_REFRESHED: TokenRefreshedPayload;
  TOKEN_EXPIRED: TokenExpiredPayload;
  ERROR: ErrorPayload;
}

/** Payload emitted when the user's authentication state changes. */
export interface AuthStateChangedPayload {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  user: User | null;
}

/** Payload emitted when the access token is refreshed. */
export interface TokenRefreshedPayload {
  accessToken: string;
  expiresAt: number;
}

/** Payload emitted when the access token expires. */
export interface TokenExpiredPayload {
  expiredAt: number;
}

/** Payload emitted when an SDK error occurs. */
export interface ErrorPayload {
  code: string;
  message: string;
  context?: string;
}
