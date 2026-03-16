// Vue 3 Composition API composable.
// SSR 없는 순수 브라우저 환경이므로 별도 guard 불필요.
import { ref, onUnmounted } from 'vue';
import * as Transcodes from '@bigstrider/transcodes-sdk';
import { DEV_EXAMPLE_URL } from '../../../constants';
import type { User } from '@bigstrider/transcodes-sdk';

export function useTranscodes() {
  const status = ref<'idle' | 'initializing' | 'ready' | 'error'>('idle');
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const errorMsg = ref('');
  const eventLog = ref<string[]>([]);

  // AUTH_STATE_CHANGED 구독 해제 함수
  let unsubscribe: (() => void) | null = null;

  onUnmounted(() => {
    unsubscribe?.();
  });

  async function initialize(projectId: string) {
    if (!projectId) return;
    status.value = 'initializing';
    errorMsg.value = '';
    try {
      await Transcodes.init(projectId, { baseUrl: DEV_EXAMPLE_URL });
      isAuthenticated.value = await Transcodes.isAuthenticated();
      user.value = isAuthenticated.value ? await Transcodes.getCurrentUser() : null;
      status.value = 'ready';

      // init 완료 후 이벤트 구독
      unsubscribe = Transcodes.on('AUTH_STATE_CHANGED', (payload) => {
        isAuthenticated.value = payload.isAuthenticated;
        user.value = payload.user;
        eventLog.value = [
          `[${new Date().toLocaleTimeString()}] AUTH_STATE_CHANGED → ${payload.isAuthenticated}`,
          ...eventLog.value.slice(0, 9),
        ];
      });
    } catch (e) {
      errorMsg.value = e instanceof Error ? e.message : '초기화 실패';
      status.value = 'error';
    }
  }

  async function login() {
    const result = await Transcodes.openAuthLoginModal({ webhookNotification: false });
    if (result.success && result.payload?.[0]) {
      isAuthenticated.value = true;
      user.value = result.payload[0].user;
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
