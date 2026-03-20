// SDK 상태와 액션을 캡슐화하는 커스텀 훅.
// SSR 없는 순수 브라우저 환경이므로 별도 guard 불필요.
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Transcodes from '@bigstrider/transcodes-sdk';
import type { User } from '@bigstrider/transcodes-sdk';

type SdkStatus = 'idle' | 'initializing' | 'ready' | 'error';

/**
 * React hook that encapsulates Transcodes SDK state and actions.
 *
 * @returns SDK status, authenticated user, event log, and action handlers (initialize, login, openConsole, logout).
 */
export function useTranscodes() {
  const [status, setStatus] = useState<SdkStatus>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  // AUTH_STATE_CHANGED 구독 해제 함수 저장
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (status !== 'ready') return;
    // init() 완료 후에만 이벤트 구독
    unsubscribeRef.current = Transcodes.on('AUTH_STATE_CHANGED', (payload) => {
      setIsAuthenticated(payload.isAuthenticated);
      setUser(payload.user);
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] AUTH_STATE_CHANGED → ${payload.isAuthenticated}`,
        ...prev.slice(0, 9),
      ]);
    });
    return () => {
      unsubscribeRef.current?.();
    };
  }, [status]);

  const initialize = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setStatus('initializing');
    setErrorMsg('');
    try {
      await Transcodes.init(projectId);
      const authed = await Transcodes.isAuthenticated();
      setIsAuthenticated(authed);
      setUser(authed ? await Transcodes.getCurrentUser() : null);
      setStatus('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '초기화 실패');
      setStatus('error');
    }
  }, []);

  const login = useCallback(async () => {
    const result = await Transcodes.openAuthLoginModal({ webhookNotification: false });
    console.log("🚀 ~ result:", result)
    if (result.success && result.payload?.[0]) {
      setIsAuthenticated(true);
      setUser(result.payload[0].user);
    }
  }, []);

  const openConsole = useCallback(() => Transcodes.openAuthConsoleModal(), []);

  const logout = useCallback(async () => {
    await Transcodes.signOut();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return { status, user, isAuthenticated, eventLog, errorMsg, initialize, login, openConsole, logout };
}
