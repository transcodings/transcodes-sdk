/**
 * Transcodes SDK Type Definitions
 *
 * AUTO-GENERATED - DO NOT EDIT
 */



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


export declare const TranscodesEventNames: {
  readonly AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED';
  readonly TOKEN_REFRESHED: 'TOKEN_REFRESHED';
  readonly TOKEN_EXPIRED: 'TOKEN_EXPIRED';
  readonly ERROR: 'ERROR';
};


/**
 * Union type for window.transcodes
 */
export type TranscodesAPI = TranscodesStaticAPI | TranscodesDynamicAPI;


/**
 * Static SDK API
 */
export interface TranscodesStaticAPI extends TranscodesBaseAPI {
  showMessage: (message: string) => void;
}


/**
 * Dynamic SDK API
 */
export interface TranscodesDynamicAPI extends TranscodesBaseAPI {
  /**
   * Initialize the SDK with configuration
   */
  init: (options: TranscodesInitOptions) => Promise<void>;

  /**
   * Update SDK configuration at runtime
   */
  setConfig: (options: { customUserId?: string }) => void;

  /**
   * Check if SDK is initialized
   */
  isInitialized: () => boolean;
}


/**
 * Common base API interface shared by Static and Dynamic SDK
 */
export interface TranscodesBaseAPI {
  // Public Token API
  token: TokenAPI;
  user: PublicUserAPI;

  // Event API
  on: PublicEventAPI['on'];
  off: PublicEventAPI['off'];

  // Modal methods (public API)
  openAuthLoginModal: (params: {
    projectId?: string;
    /** Slack 웹훅 알림 발송 여부. true 시 로그인 성공/실패 시 Slack 알림 발송. Default: false */
    webhookNotification?: boolean;
  }) => Promise<ApiResponse<AuthResult[]>>;
  openAuthConsoleModal: (params?: {
    projectId?: string;
  }) => Promise<ApiResponse<null>>;
  openAuthAdminModal: (params: {
    projectId?: string;
    allowedRoles: string[];
  }) => Promise<ApiResponse<null>>;
  // RBAC-based step-up authentication with resource+action permission check
  openAuthIdpModal: (
    params: IdpOpenParams & { projectId?: string },
  ) => Promise<ApiResponse<IdpAuthResponse[]>>;

  // Audit API
  /**
   * 사용자 행동 추적 (Audit Log)
   *
   * @param event - 추적할 이벤트 정보
   * @param event.tag - 태그 (예: 'user:login', 'user:register', 'document:create')
   * @param event.severity - 심각도 ('low' | 'medium' | 'high'), 기본값: 'low'
   * @param event.status - 성공/실패 여부, 기본값: true
   * @param event.error - 에러 메시지 (status: false 시 사용)
   * @param event.metadata - 추가 메타데이터 (예: { method: 'passkey' })
   * @param options - 추가 옵션
   * @param options.requireAuth - 미인증 시 로그인 모달 표시 여부, 기본값: false
   */
  trackUserAction: (
    event: {
      /** 태그 (필수) */
      tag: string;
      /** 심각도 (선택, 기본값: 'low') */
      severity?: 'low' | 'medium' | 'high';
      /** 성공/실패 여부 (선택, 기본값: true) */
      status?: boolean;
      /** 에러 메시지 (선택, status: false 시 사용) */
      error?: string;
      /** 추가 메타데이터 (선택) */
      metadata?: Record<string, unknown>;
      /** 페이지 URL (선택, 미전달 시 window.location.href 자동 수집) */
      page?: string;
    },
    options?: {
      /** If true, opens login modal when user not authenticated. Default: false */
      requireAuth?: boolean;
      /** Slack 웹훅 알림 발송 여부. true 시 severity와 무관하게 Slack 알림 발송. Default: false */
      webhookNotification?: boolean;
    },
  ) => Promise<void>;
  /**
   * PWA 설치 여부 확인
   * Host 앱에서 설치 버튼 표시/숨김 제어에 사용
   * @returns 설치됐으면 true
   */
  isPwaInstalled: () => boolean;
}


/**
 * SDK Initialization Options (Dynamic SDK only)
 */
export interface TranscodesInitOptions {
  /** Project ID from Transcodes dashboard */
  projectId: string;
  /**
   * 로컬 개발용 백엔드 URL. 지정 시 CDN 대신 해당 서버에서 webworker.js를 로드합니다.
   * 예: 'http://localhost:3500'
   */
  baseUrl?: string;
  /**
   * @deprecated Server derives rpId from project domain_url. This field is no longer required.
   * Relying Party ID - the domain where the SDK is running (e.g., 'example.com')
   */
  rpId?: string;
  /**
   * Custom user ID for SDK integration with external auth systems
   * (e.g., Firebase UID, Auth0 user_id)
   * @optional
   */
  customUserId?: string;
  /** Enable debug logging */
  debug?: boolean;
}


export interface TokenAPI {
  /**
   * Returns the current authenticated user information.
   * Extracts user information from JWT and returns immediately without API calls.
   * Returns null if not authenticated.
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Returns a valid Access Token.
   * Lookup order: Memory → IndexedDB → New issuance with Attestation Key.
   * Returns null if all are unavailable or expired.
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Synchronously checks if there is a valid token in memory.
   */
  hasToken(): boolean;

  /**
   * Checks if the user is authenticated.
   * Performs pure validity check without token issuance.
   * Checks in order: Memory → IndexedDB.
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Logs out the user.
   * Deletes memory token and calls SessionManager.clear().
   * @param options.webhookNotification - Slack 웹훅 알림 발송 여부 (default: false)
   */
  signOut(options?: { webhookNotification?: boolean }): Promise<void>;
}


/**
 * Public User API (exposed on window.transcodes.user)
 * Safe methods for user operations
 */
export interface PublicUserAPI {
  get(params: {
    projectId?: string;
    userId?: string;
    email?: string;
    fields?: string;
  }): Promise<ApiResponse<User[]>>;
}


/**
 * Public Event API Interface
 */
export interface PublicEventAPI {
  on<T extends TranscodesEventName>(
    event: T,
    callback: EventCallback<T>,
  ): () => void;
  off<T extends TranscodesEventName>(
    event: T,
    callback: EventCallback<T>,
  ): void;
}


/**
 * Base API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  payload: T;
  error?: string;
  message?: string;
  status?: number;
}


/**
 * Authentication result with token and user
 */
export interface AuthResult {
  token: string;
  user: User;
}


/**
 * IDP Domain Types
 *
 * Type definitions for IDP (Internal Identity Provider) module
 */

/**
 * Parameters for opening the IDP modal
 */
export interface IdpOpenParams {
  /** Resource key for RBAC check (e.g. 'users', 'revenue') */
  resource: string;
  /** CRUD action type (create, read, update, delete) */
  action: 'create' | 'read' | 'update' | 'delete';
  /** Force step-up authentication regardless of permission level (default: false) */
  forceStepUp?: boolean;
  /** Slack 웹훅 알림 발송 여부. true 시 step-up 스킵/성공/실패 모두 Slack 알림 발송. Default: false */
  webhookNotification?: boolean;
}


/**
 * Response from IDP authentication
 */
export interface IdpAuthResponse {
  /** Authentication success status */
  success: boolean;
  /** Step-up Session ID (on success) */
  sid?: string;
  /** Error message (on failure) */
  error?: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Requested action type */
  action?: string;
}


/**
 * User information
 */
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


export type TranscodesEventName =
  (typeof TranscodesEventNames)[keyof typeof TranscodesEventNames];


/**
 * Type-safe event callback
 */
export type EventCallback<T extends TranscodesEventName> = (
  payload: TranscodesEventMap[T],
) => void;


/**
 * Event map for type-safe callbacks
 */
export interface TranscodesEventMap {
  AUTH_STATE_CHANGED: AuthStateChangedPayload;
  TOKEN_REFRESHED: TokenRefreshedPayload;
  TOKEN_EXPIRED: TokenExpiredPayload;
  ERROR: ErrorPayload;
}


/**
 * Payload for AUTH_STATE_CHANGED event
 * Emitted when authentication state changes (login/logout)
 */
export interface AuthStateChangedPayload {
  isAuthenticated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  user: User | null;
}


/**
 * Payload for TOKEN_REFRESHED event
 * Emitted when access token is refreshed
 */
export interface TokenRefreshedPayload {
  accessToken: string;
  expiresAt: number;
}


/**
 * Payload for TOKEN_EXPIRED event
 * Emitted when token expires and refresh is needed
 */
export interface TokenExpiredPayload {
  expiredAt: number;
}


/**
 * Payload for ERROR event
 * Emitted when SDK encounters an error
 */
export interface ErrorPayload {
  code: string;
  message: string;
  context?: string;
}
