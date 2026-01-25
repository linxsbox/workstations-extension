<script setup>
import { computed, onUnmounted } from 'vue';
import { storeMobileSync } from '@/stores/miniapps/mobilesync';
import IconPhonelink from '@/components/common/Icons/IconPhonelink.vue';
import QRCodeDialog from './QRCodeDialog.vue';

const mobileSyncStore = storeMobileSync();

// 是否已连接
const isConnected = computed(() => mobileSyncStore.isConnected);

// 动态计算 QR URL
const qrUrl = computed(() => mobileSyncStore.qrUrl);

// 打开二维码弹窗
const handleOpenSync = () => {
  mobileSyncStore.openQRDialog();
};

// 组件卸载时清理
onUnmounted(() => {
  mobileSyncStore.cleanup();
});
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
    <div class="app-label">手机同步</div>

    <!-- 二维码弹窗 -->
    <QRCodeDialog
      v-model:show="mobileSyncStore.showQRDialog"
      :qr-url="qrUrl"
      :status="mobileSyncStore.status"
      :connected-devices="mobileSyncStore.connectedDevices"
      @start-sync="mobileSyncStore.initWebRTC"
      @stop-sync="mobileSyncStore.stopSync"
      @refresh="mobileSyncStore.refreshQRCode"
    />
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
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.95);
  }
}
</style>
