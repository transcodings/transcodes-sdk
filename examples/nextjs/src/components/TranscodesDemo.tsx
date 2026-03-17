'use client';
// SDK의 모든 호출은 이 클라이언트 컴포넌트 안에서만 실행됨.
// 'use client' 경계가 SSR 환경에서의 window 접근을 방지.
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Transcodes from '@bigstrider/transcodes-sdk';
import type { User } from '@bigstrider/transcodes-sdk';

type SdkStatus = 'idle' | 'initializing' | 'ready' | 'error';

const STATUS_COLORS: Record<SdkStatus, string> = {
  idle: '#888',
  initializing: '#e67e00',
  ready: '#1a7a1a',
  error: '#cc0000',
};

export default function TranscodesDemo() {
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<SdkStatus>('idle');
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  // AUTH_STATE_CHANGED 구독 해제 함수 저장
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (status !== 'ready') return;
    // init() 완료 후에만 이벤트 구독
    unsubscribeRef.current = Transcodes.on('AUTH_STATE_CHANGED', (payload) => {
      setIsAuth(payload.isAuthenticated);
      setUser(payload.user);
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] AUTH_STATE_CHANGED → authenticated=${payload.isAuthenticated}`,
        ...prev.slice(0, 9),
      ]);
    });
    return () => {
      unsubscribeRef.current?.();
    };
  }, [status]);

  const handleInit = useCallback(async () => {
    if (!projectId.trim()) return;
    setStatus('initializing');
    setErrorMsg('');
    try {
      await Transcodes.init(projectId.trim());
      const authed = await Transcodes.isAuthenticated();
      setIsAuth(authed);
      setUser(authed ? await Transcodes.getCurrentUser() : null);
      setStatus('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '초기화 실패');
      setStatus('error');
    }
  }, [projectId]);

  const handleLogin = useCallback(async () => {
    const result = await Transcodes.openAuthLoginModal({ webhookNotification: false });
    console.log("🚀 ~ result:", result)
    if (result.success && result.payload?.[0]) {
      setIsAuth(true);
      setUser(result.payload[0].user);
    }
  }, []);

  const handleConsole = useCallback(() => Transcodes.openAuthConsoleModal(), []);

  const handleSignOut = useCallback(async () => {
    await Transcodes.signOut();
    setIsAuth(false);
    setUser(null);
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
        Transcodes SDK — Next.js 15 (App Router)
      </h1>

      {/* 상태 뱃지 */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: '4px',
          background: STATUS_COLORS[status], color: '#fff', fontSize: '0.85rem',
        }}>
          {status}
        </span>
        {errorMsg && (
          <span style={{ color: '#cc0000', marginLeft: '1rem', fontSize: '0.85rem' }}>
            {errorMsg}
          </span>
        )}
      </div>

      {/* Project ID 입력 + 초기화 */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Project ID"
          disabled={status === 'initializing'}
          style={{ flex: 1, padding: '6px 10px', fontFamily: 'monospace', border: '1px solid #ccc' }}
        />
        <button
          onClick={handleInit}
          disabled={!projectId.trim() || status === 'initializing' || status === 'ready'}
          style={{ padding: '6px 16px', cursor: 'pointer', fontFamily: 'monospace' }}
        >
          {status === 'initializing' ? '초기화 중...' : 'Init SDK'}
        </button>
      </div>

      {/* 인증 상태 및 액션 버튼 */}
      {status === 'ready' && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e0e0e0' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <strong>인증 상태:</strong>{' '}
            <span style={{ color: isAuth ? '#1a7a1a' : '#888' }}>
              {isAuth ? `✓ 인증됨 (${user?.email ?? '이메일 없음'})` : '미인증'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!isAuth ? (
              <button onClick={handleLogin} style={{ padding: '5px 12px', cursor: 'pointer', fontFamily: 'monospace' }}>
                Login Modal
              </button>
            ) : (
              <>
                <button onClick={handleConsole} style={{ padding: '5px 12px', cursor: 'pointer', fontFamily: 'monospace' }}>
                  Console Modal
                </button>
                <button onClick={handleSignOut} style={{ padding: '5px 12px', cursor: 'pointer', fontFamily: 'monospace' }}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* AUTH_STATE_CHANGED 이벤트 로그 */}
      {eventLog.length > 0 && (
        <div>
          <strong style={{ fontSize: '0.85rem' }}>이벤트 로그</strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#555' }}>
            {eventLog.map((log, i) => (
              <li key={i} style={{ padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
