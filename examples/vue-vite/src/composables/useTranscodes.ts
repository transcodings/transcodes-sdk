// Vue 3 Composition API composable.
// Pure browser environment with no SSR, so no additional guards needed.
import { ref, onUnmounted } from 'vue';
import * as Transcodes from '@bigstrider/transcodes-sdk';
import type { Member } from '@bigstrider/transcodes-sdk';

/**
 * Vue 3 composable that encapsulates Transcodes SDK state and actions.
 *
 * @returns Reactive SDK status, authenticated user, event log, and action handlers (initialize, login, openConsole, logout).
 */
export function useTranscodes() {
  const status = ref<'idle' | 'initializing' | 'ready' | 'error'>('idle');
  const user = ref<Member | null>(null);
  const isAuthenticated = ref(false);
  const errorMsg = ref('');
  const eventLog = ref<string[]>([]);

  // AUTH_STATE_CHANGED unsubscribe function
  let unsubscribe: (() => void) | null = null;

  onUnmounted(() => {
    unsubscribe?.();
  });

  async function initialize(projectId: string) {
    if (!projectId) return;
    status.value = 'initializing';
    errorMsg.value = '';
    try {
      await Transcodes.init(projectId);
      isAuthenticated.value = await Transcodes.isAuthenticated();
      user.value = isAuthenticated.value ? await Transcodes.getCurrentMember() : null;
      status.value = 'ready';

      // Subscribe to events after init completes
      unsubscribe = Transcodes.on('AUTH_STATE_CHANGED', (payload) => {
        isAuthenticated.value = payload.isAuthenticated;
        user.value = payload.member;
        eventLog.value = [
          `[${new Date().toLocaleTimeString()}] AUTH_STATE_CHANGED → ${payload.isAuthenticated}`,
          ...eventLog.value.slice(0, 9),
        ];
      });
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : 'Initialization failed';
      status.value = 'error';
    }
  }

  async function login() {
    const result = await Transcodes.openAuthLoginModal({ webhookNotification: false });
    if (result.success && result.payload?.[0]) {
      isAuthenticated.value = true;
      user.value = result.payload[0].member;
    }
  }

  async function openConsole() {
    await Transcodes.openAuthConsoleModal();
  }

  async function logout() {
    await Transcodes.signOut();
    isAuthenticated.value = false;
    user.value = null;
  }

  return { status, user, isAuthenticated, errorMsg, eventLog, initialize, login, openConsole, logout };
}
