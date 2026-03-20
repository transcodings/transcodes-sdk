<script lang="ts">
  // browser: checks SSR environment. true guarantees browser execution.
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  import type { User } from '@bigstrider/transcodes-sdk';

  type SdkStatus = 'idle' | 'initializing' | 'ready' | 'error';

  // Svelte 5 runes mode
  let projectId = $state('');
  let status = $state<SdkStatus>('idle');
  let user = $state<User | null>(null);
  let isAuthenticated = $state(false);
  let errorMsg = $state('');
  let eventLog = $state<string[]>([]);

  const statusColors: Record<SdkStatus, string> = {
    idle: '#888',
    initializing: '#e67e00',
    ready: '#1a7a1a',
    error: '#cc0000',
  };

  // Stores SDK module reference after dynamic import
  let sdk: typeof import('@bigstrider/transcodes-sdk') | null = null;
  // AUTH_STATE_CHANGED unsubscribe function
  let unsubscribe: (() => void) | null = null;

  onDestroy(() => {
    unsubscribe?.();
  });

  async function handleInit() {
    // browser guard: cannot run during SSR
    if (!browser || !projectId.trim()) return;
    status = 'initializing';
    errorMsg = '';
    try {
      // Dynamic import to fully exclude SDK from the SSR bundle
      sdk = await import('@bigstrider/transcodes-sdk');
      await sdk.init(projectId.trim());
      isAuthenticated = await sdk.isAuthenticated();
      user = isAuthenticated ? await sdk.getCurrentUser() : null;
      status = 'ready';

      // Subscribe to events after init completes
      unsubscribe = sdk.on('AUTH_STATE_CHANGED', (payload) => {
        isAuthenticated = payload.isAuthenticated;
        user = payload.user;
        eventLog = [
          `[${new Date().toLocaleTimeString()}] AUTH_STATE_CHANGED → ${payload.isAuthenticated}`,
          ...eventLog.slice(0, 9),
        ];
      });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Initialization failed';
      status = 'error';
    }
  }

  async function handleLogin() {
    if (!sdk) return;
    const result = await sdk.openAuthLoginModal({ webhookNotification: false });
    if (result.success && result.payload?.[0]) {
      isAuthenticated = true;
      user = result.payload[0].user;
    }
  }

  async function handleConsole() {
    if (!sdk) return;
    await sdk.openAuthConsoleModal();
  }

  async function handleSignOut() {
    if (!sdk) return;
    await sdk.signOut();
    isAuthenticated = false;
    user = null;
  }
</script>

<div style="padding: 2rem; max-width: 640px; margin: 0 auto; font-family: monospace;">
  <h1 style="font-size: 1.2rem; margin-bottom: 1.5rem;">
    Transcodes SDK — SvelteKit (Svelte 5)
  </h1>

  <!-- Status badge -->
  <div style="margin-bottom: 1rem;">
    <span style="display: inline-block; padding: 2px 10px; border-radius: 4px; background: {statusColors[status]}; color: #fff; font-size: 0.85rem;">
      {status}
    </span>
    {#if errorMsg}
      <span style="color: #cc0000; margin-left: 1rem; font-size: 0.85rem;">{errorMsg}</span>
    {/if}
  </div>

  <!-- Project ID input + initialization -->
  <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem;">
    <input
      type="text"
      bind:value={projectId}
      placeholder="Project ID"
      disabled={status === 'initializing'}
      style="flex: 1; padding: 6px 10px; font-family: monospace; border: 1px solid #ccc;"
    />
    <button
      onclick={handleInit}
      disabled={!projectId.trim() || status === 'initializing' || status === 'ready'}
      style="padding: 6px 16px; cursor: pointer; font-family: monospace;"
    >
      {status === 'initializing' ? 'Initializing...' : 'Init SDK'}
    </button>
  </div>

  <!-- Auth status and action buttons -->
  {#if status === 'ready'}
    <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e0e0e0;">
      <div style="margin-bottom: 0.75rem; font-size: 0.9rem;">
        <strong>Auth Status:</strong>
        <span style="color: {isAuthenticated ? '#1a7a1a' : '#888'};">
          {isAuthenticated ? `✓ Authenticated (${user?.email ?? 'No email'})` : 'Not authenticated'}
        </span>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        {#if !isAuthenticated}
          <button onclick={handleLogin} style="padding: 5px 12px; cursor: pointer; font-family: monospace;">
            Login Modal
          </button>
        {:else}
          <button onclick={handleConsole} style="padding: 5px 12px; cursor: pointer; font-family: monospace;">
            Console Modal
          </button>
          <button onclick={handleSignOut} style="padding: 5px 12px; cursor: pointer; font-family: monospace;">
            Sign Out
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- AUTH_STATE_CHANGED event log -->
  {#if eventLog.length > 0}
    <div>
      <strong style="font-size: 0.85rem;">Event Log</strong>
      <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0; font-size: 0.8rem; color: #555;">
        {#each eventLog as log}
          <li style="padding: 3px 0; border-bottom: 1px solid #f0f0f0;">{log}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
