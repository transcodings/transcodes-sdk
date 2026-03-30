'use client';
// All SDK calls run only inside this client component.
// The 'use client' boundary prevents window access in SSR.
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Transcodes from '@bigstrider/transcodes-sdk';
import type { Member } from '@bigstrider/transcodes-sdk';

type SdkStatus = 'idle' | 'initializing' | 'ready' | 'error';

const STATUS_COLORS: Record<SdkStatus, string> = {
  idle: '#64748b',
  initializing: '#d97706',
  ready: '#15803d',
  error: '#dc2626',
};

/** Roles allowed for the admin modal (demo). */
const ADMIN_ALLOWED_ROLES = ['admin', 'superadmin'] as const;

const shell = {
  pageBg: '#f1f5f9',
  sidebarBg: '#0f172a',
  sidebarText: '#e2e8f0',
  sidebarMuted: '#94a3b8',
  cardBg: '#ffffff',
  border: '#e2e8f0',
  accent: '#2563eb',
  text: '#0f172a',
  muted: '#64748b',
} as const;

/** Admin-style dashboard that exercises the Transcodes SDK. */
export default function TranscodesDemo() {
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<SdkStatus>('idle');
  const [user, setUser] = useState<Member | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [buildTime, setBuildTime] = useState<string | null>(null);
  const [auditMsg, setAuditMsg] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (status !== 'ready') return;
    unsubscribeRef.current = Transcodes.on('AUTH_STATE_CHANGED', (payload) => {
      setIsAuth(payload.isAuthenticated);
      setUser(payload.member);
      setEventLog((prev) => [
        `[${new Date().toLocaleTimeString()}] AUTH_STATE_CHANGED → ${String(payload.isAuthenticated)}`,
        ...prev.slice(0, 14),
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
    setAuditMsg('');
    try {
      await Transcodes.init(projectId.trim());
      const authed = await Transcodes.isAuthenticated();
      setIsAuth(authed);
      setUser(authed ? await Transcodes.getCurrentMember() : null);
      setPwaInstalled(Transcodes.isPwaInstalled());
      try {
        const sdk = await Transcodes.clientAsync();
        if ('getBuildInfo' in sdk) {
          const info = sdk.getBuildInfo();
          setBuildTime(info.buildTimestamp);
        } else {
          setBuildTime(null);
        }
      } catch {
        setBuildTime(null);
      }
      setStatus('ready');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Initialization failed');
      setStatus('error');
    }
  }, [projectId]);

  const handleLogin = useCallback(async () => {
    const result = await Transcodes.openAuthLoginModal({ webhookNotification: false });
    if (result.success && result.payload?.[0]) {
      setIsAuth(true);
      setUser(result.payload[0].member);
    }
  }, []);

  const handleConsole = useCallback(() => Transcodes.openAuthConsoleModal(), []);

  const handleAdminModal = useCallback(async () => {
    await Transcodes.openAuthAdminModal({ allowedRoles: [...ADMIN_ALLOWED_ROLES] });
  }, []);

  const handleIdpModal = useCallback(async () => {
    await Transcodes.openAuthIdpModal({
      resource: 'admin_dashboard',
      action: 'read',
      webhookNotification: false,
    });
  }, []);

  const handleSampleAudit = useCallback(async () => {
    setAuditMsg('');
    try {
      await Transcodes.trackUserAction(
        {
          tag: 'admin_dashboard_demo',
          severity: 'low',
          status: true,
          page: 'admin',
        },
        { requireAuth: false, webhookNotification: false }
      );
      setAuditMsg('Audit event sent.');
    } catch (e) {
      setAuditMsg(e instanceof Error ? e.message : 'Failed to send audit event');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await Transcodes.signOut();
    setIsAuth(false);
    setUser(null);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: shell.pageBg,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        color: shell.text,
      }}
    >
      <aside
        style={{
          width: '240px',
          flexShrink: 0,
          background: shell.sidebarBg,
          color: shell.sidebarText,
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.06em', color: shell.sidebarMuted }}>
            TRANSCODES
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>Admin</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>Overview</span>
          <span style={{ color: shell.sidebarMuted }}>Auth &amp; session</span>
          <span style={{ color: shell.sidebarMuted }}>Audit &amp; events</span>
        </nav>
        <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: shell.sidebarMuted }}>
          Next.js 15 App Router
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            background: shell.cardBg,
            borderBottom: `1px solid ${shell.border}`,
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              Admin · Transcodes SDK — Next.js 15
            </h1>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: shell.muted }}>
              Connect a project, manage auth, and try admin IDP and audit APIs.
            </p>
          </div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '999px',
              background: STATUS_COLORS[status],
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          >
            {status}
          </span>
        </header>

        <main style={{ padding: '1.25rem 1.5rem 2rem', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: '0.85rem',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <section
              style={{
                background: shell.cardBg,
                border: `1px solid ${shell.border}`,
                borderRadius: '12px',
                padding: '1.1rem 1.15rem',
              }}
            >
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>SDK connection</h2>
              <label style={{ fontSize: '0.75rem', color: shell.muted, display: 'block', marginBottom: '0.35rem' }}>
                Project ID
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="Project ID"
                  disabled={status === 'initializing'}
                  style={{
                    flex: '1 1 160px',
                    minWidth: 0,
                    padding: '8px 10px',
                    border: `1px solid ${shell.border}`,
                    borderRadius: '8px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.85rem',
                  }}
                />
                <button
                  type="button"
                  onClick={handleInit}
                  disabled={!projectId.trim() || status === 'initializing' || status === 'ready'}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: shell.accent,
                    color: '#fff',
                    fontWeight: 600,
                    cursor:
                      !projectId.trim() || status === 'initializing' || status === 'ready'
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: !projectId.trim() || status === 'initializing' || status === 'ready' ? 0.5 : 1,
                  }}
                >
                  {status === 'initializing' ? 'Initializing…' : 'Init SDK'}
                </button>
              </div>
              {buildTime && (
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: shell.muted }}>
                  Build:{' '}
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                    {buildTime}
                  </span>
                </p>
              )}
            </section>

            <section
              style={{
                background: shell.cardBg,
                border: `1px solid ${shell.border}`,
                borderRadius: '12px',
                padding: '1.1rem 1.15rem',
              }}
            >
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>Session</h2>
              {status === 'ready' ? (
                <>
                  <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    <strong>Auth Status:</strong>{' '}
                    <span style={{ color: isAuth ? '#15803d' : shell.muted }}>
                      {isAuth ? `✓ Authenticated (${user?.email ?? 'No email'})` : 'Not authenticated'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {!isAuth ? (
                      <button
                        type="button"
                        onClick={handleLogin}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${shell.border}`,
                          background: shell.cardBg,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Login Modal
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleConsole}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${shell.border}`,
                            background: shell.cardBg,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Console Modal
                        </button>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: '#fff',
                            color: '#b91c1c',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Sign Out
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: shell.muted }}>
                  Initialize the SDK to show session controls.
                </p>
              )}
            </section>

            <section
              style={{
                background: shell.cardBg,
                border: `1px solid ${shell.border}`,
                borderRadius: '12px',
                padding: '1.1rem 1.15rem',
                gridColumn: '1 / -1',
              }}
            >
              <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>Admin &amp; audit</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={status !== 'ready'}
                  onClick={handleAdminModal}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#fff',
                    cursor: status === 'ready' ? 'pointer' : 'not-allowed',
                    opacity: status === 'ready' ? 1 : 0.45,
                    fontSize: '0.85rem',
                  }}
                >
                  Admin Modal (RBAC)
                </button>
                <button
                  type="button"
                  disabled={status !== 'ready'}
                  onClick={handleIdpModal}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${shell.border}`,
                    background: shell.cardBg,
                    cursor: status === 'ready' ? 'pointer' : 'not-allowed',
                    opacity: status === 'ready' ? 1 : 0.45,
                    fontSize: '0.85rem',
                  }}
                >
                  IDP step-up
                </button>
                <button
                  type="button"
                  disabled={status !== 'ready'}
                  onClick={handleSampleAudit}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${shell.border}`,
                    background: shell.cardBg,
                    cursor: status === 'ready' ? 'pointer' : 'not-allowed',
                    opacity: status === 'ready' ? 1 : 0.45,
                    fontSize: '0.85rem',
                  }}
                >
                  Sample audit event
                </button>
                <span style={{ fontSize: '0.8rem', color: shell.muted }}>
                  PWA installed:{' '}
                  <strong style={{ color: shell.text }}>{pwaInstalled ? 'Yes' : 'No'}</strong>
                </span>
              </div>
              {auditMsg && (
                <p style={{ margin: '0.65rem 0 0', fontSize: '0.8rem', color: '#15803d' }}>{auditMsg}</p>
              )}
            </section>
          </div>

          {eventLog.length > 0 && (
            <div
              style={{
                marginTop: '1.25rem',
                background: shell.cardBg,
                border: `1px solid ${shell.border}`,
                borderRadius: '12px',
                padding: '1rem 1.15rem',
              }}
            >
              <strong style={{ fontSize: '0.85rem' }}>Auth events</strong>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0.5rem 0 0',
                  fontSize: '0.8rem',
                  color: shell.muted,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {eventLog.map((log, i) => (
                  <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                    {log}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
