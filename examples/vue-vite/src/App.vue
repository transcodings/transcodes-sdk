<script setup lang="ts">
import { ref } from 'vue';
import { useTranscodes } from './composables/useTranscodes';

const projectId = ref('');
const {
  status, user, isAuthenticated, errorMsg, eventLog,
  initialize, login, openConsole, logout,
} = useTranscodes();

const statusColors = {
  idle: '#888',
  initializing: '#e67e00',
  ready: '#1a7a1a',
  error: '#cc0000',
} as const;
</script>

<template>
  <div style="padding: 2rem; max-width: 640px; margin: 0 auto; font-family: monospace;">
    <h1 style="font-size: 1.2rem; margin-bottom: 1.5rem;">
      Transcodes SDK — Vue 3 + Vite
    </h1>

    <!-- 상태 뱃지 -->
    <div style="margin-bottom: 1rem;">
      <span :style="{
        display: 'inline-block', padding: '2px 10px', borderRadius: '4px',
        background: statusColors[status], color: '#fff', fontSize: '0.85rem',
      }">
        {{ status }}
      </span>
      <span v-if="errorMsg" style="color: #cc0000; margin-left: 1rem; font-size: 0.85rem;">
        {{ errorMsg }}
      </span>
    </div>

    <!-- Project ID 입력 + 초기화 -->
    <div style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem;">
      <input
        v-model="projectId"
        type="text"
        placeholder="Project ID"
        :disabled="status === 'initializing'"
        style="flex: 1; padding: 6px 10px; font-family: monospace; border: 1px solid #ccc;"
      />
      <button
        @click="initialize(projectId.trim())"
        :disabled="!projectId.trim() || status === 'initializing' || status === 'ready'"
        style="padding: 6px 16px; cursor: pointer; font-family: monospace;"
      >
        {{ status === 'initializing' ? '초기화 중...' : 'Init SDK' }}
      </button>
    </div>

    <!-- 인증 상태 및 액션 버튼 -->
    <div v-if="status === 'ready'" style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e0e0e0;">
      <div style="margin-bottom: 0.75rem; font-size: 0.9rem;">
        <strong>인증 상태:</strong>
        <span :style="{ color: isAuthenticated ? '#1a7a1a' : '#888' }">
          {{ isAuthenticated ? `✓ 인증됨 (${user?.email ?? '이메일 없음'})` : '미인증' }}
        </span>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button v-if="!isAuthenticated" @click="login" style="padding: 5px 12px; cursor: pointer; font-family: monospace;">
          Login Modal
        </button>
        <template v-else>
          <button @click="openConsole" style="padding: 5px 12px; cursor: pointer; font-family: monospace;">
            Console Modal
          </button>
          <button @click="logout" style="padding: 5px 12px; cursor: pointer; font-family: monospace;">
            Sign Out
          </button>
        </template>
      </div>
    </div>

    <!-- AUTH_STATE_CHANGED 이벤트 로그 -->
    <div v-if="eventLog.length > 0">
      <strong style="font-size: 0.85rem;">이벤트 로그</strong>
      <ul style="list-style: none; padding: 0; margin: 0.5rem 0 0; font-size: 0.8rem; color: #555;">
        <li
          v-for="(log, i) in eventLog"
          :key="i"
          style="padding: 3px 0; border-bottom: 1px solid #f0f0f0;"
        >{{ log }}</li>
      </ul>
    </div>
  </div>
</template>
