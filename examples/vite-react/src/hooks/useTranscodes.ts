// Custom hook that encapsulates SDK state and actions.
// Pure browser environment with no SSR, so no additional guards needed.
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
  // Stores the AUTH_STATE_CHANGED unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (status !== 'ready') return;
    // Subscribe to events only after init() completes
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
      setErrorMsg(e instanceof Error ? e.message : 'Initialization failed');
      setStatus('error');
    }
  }, []);

  const login = useCallback(async () => {
    const result = await Transcodes.openAuthLoginModal({ webhookNotification: false });
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
