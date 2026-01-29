<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { storeMobileSync } from '@/stores/miniapps/mobilesync';
import IconPhonelink from '@/components/common/Icons/IconPhonelink.vue';
import QRCodeDialog from './QRCodeDialog.vue';

const mobileSyncStore = storeMobileSync();

// 计算属性
const isConnected = computed(() => mobileSyncStore.isConnected);
const qrUrl = computed(() => mobileSyncStore.qrUrl);

// 打开二维码弹窗
const handleOpenSync = () => {
  mobileSyncStore.openQRDialog();
};
</script>

<template>
  <div class="mobile-sync-app flex flex-col items-center gap-1">
    <!-- 小应用图标 -->
    <button
      class="app-icon"
      :class="{ active: mobileSyncStore.showQRDialog }"
      @click="handleOpenSync"
      title="手机同步"
      aria-label="打开手机同步"
    >
      <IconPhonelink class="text-2xl" />
      <!-- 连接状态指示器 -->
      <div v-if="isConnected" class="indicator"></div>
    </button>

    <!-- APP标签 -->
    <div class="app-label">手机同步 {{ mobileSyncStore.showQRDialog }}</div>

    <!-- 二维码弹窗 -->
    <QRCodeDialog v-model:show="mobileSyncStore.showQRDialog" />
  </div>
</template>

<style lang="scss" scoped>
.mobile-sync-app {
  .app-icon {
    // 连接状态指示器
    .indicator {
      @apply absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] rounded-full;
      background-color: var(--color-success);
      border: 2px solid var(--bg-primary);
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}
</style>
