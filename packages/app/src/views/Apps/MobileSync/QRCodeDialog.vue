<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { NModal, NButton, NSpin, useMessage } from 'naive-ui';
import QRCode from 'qrcode';
import { storeMobileSync, SYNC_STATUS } from '@/stores/miniapps/mobilesync';
import { storeToRefs } from 'pinia';

const mobileSyncStore = storeMobileSync();
const {
  status: storeStatus,
  qrUrl,
  connectedDevices,
} = storeToRefs(mobileSyncStore);
const message = useMessage();

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

// 二维码生成状态
const isGenerating = ref(false);
const qrcodeCanvas = ref(null);

// 计算连接状态文本
const status = computed(() => {
  switch (storeStatus.value) {
    case SYNC_STATUS.IDLE:
      return '未初始化';
    case SYNC_STATUS.INITIALIZING:
      return '初始化中...';
    case SYNC_STATUS.READY:
      return connectedDevices.value.length > 0 ? '已连接' : '等待连接';
    case SYNC_STATUS.CONNECTED:
      return '已连接';
    case SYNC_STATUS.ERROR:
      return '连接错误';
    default:
      return '未知状态';
  }
});

// 关闭弹窗
const handleClose = () => {
  mobileSyncStore.closeQRDialog();
};

// 生成二维码
const generateQRCode = async () => {
  if (!qrUrl.value || !qrcodeCanvas.value) {
    console.warn('[QRCode Dialog] 缺少必要条件，跳过生成');
    return;
  }

  isGenerating.value = true;

  try {
    await QRCode.toCanvas(qrcodeCanvas.value, qrUrl.value, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log('[QRCode Dialog] 二维码生成成功');
  } catch (error) {
    console.error('[QRCode Dialog] 二维码生成失败:', error);
    message.error('二维码生成失败');
  } finally {
    isGenerating.value = false;
  }
};

// 监听弹窗显示和 qrUrl 变化
watch(
  [() => props.show, qrUrl],
  async ([show, url]) => {
    if (show && url) {
      await nextTick();
      generateQRCode();
    }
  },
  { immediate: true }
);

// 开启同步
const handleStartSync = async () => {
  try {
    await mobileSyncStore.initialize();
    // 初始化成功后，二维码会自动生成（通过 watch）
  } catch (error) {
    message.error(`初始化失败: ${error.message}`);
  }
};

// 复制链接
const handleCopyLink = async () => {
  if (!qrUrl.value) return;

  try {
    await navigator.clipboard.writeText(qrUrl.value);
    message.success('链接已复制到剪贴板');
  } catch (error) {
    console.error('[QRCode Dialog] 复制失败:', error);
    message.error('复制失败');
  }
};

// 刷新二维码
const handleRefresh = () => {
  generateQRCode();
  message.success('二维码已刷新');
};
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="手机同步"
    class="mobile-sync-modal"
    :style="{ width: '400px' }"
    :mask-closable="true"
    @update:show="handleClose"
  >
    <div class="flex flex-col items-center gap-5">
      <!-- 未初始化状态 -->
      <div
        v-if="mobileSyncStore.currentStatus === SYNC_STATUS.IDLE"
        class="flex flex-col items-center gap-4 p-4 w-full"
      >
        <div class="text-5xl">📱</div>
        <div class="text-lg font-semibold text-[var(--text-primary)]">
          手机同步
        </div>
        <NButton
          type="primary"
          size="large"
          class="w-full mt-2"
          @click="handleStartSync"
        >
          开启同步
        </NButton>
      </div>

      <!-- 已初始化：显示二维码 -->
      <div v-else class="flex flex-col items-center gap-4 w-full">
        <!-- 二维码显示区域 -->
        <div
          class="relative w-64 h-64 flex items-center justify-center rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)]"
        >
          <NSpin :show="isGenerating">
            <canvas
              ref="qrcodeCanvas"
              class="block max-w-full max-h-full"
            ></canvas>
          </NSpin>
        </div>

        <!-- 连接状态信息 -->
        <div
          class="w-full flex justify-between items-center gap-2.5 p-2 bg-[var(--bg-secondary)] rounded"
        >
          <!-- 第一行：连接状态 -->
          <div class="flex items-center justify-center gap-2">
            <div class="w-2 h-2 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium">
              {{ status }}
            </span>
          </div>

          <!-- 第二行：已连接设备 -->
          <div class="flex items-center justify-center gap-3 text-xs">
            <div class="flex items-center gap-1.5">
              <span class="text-[var(--text-secondary)]">已连接设备：</span>
              <span class="text-[var(--text-primary)] font-medium">
                {{ connectedDevices.length }} 台
              </span>
            </div>
          </div>

          <!-- 已连接设备列表 -->
          <div
            v-if="connectedDevices.length > 0"
            class="mt-2 pt-2 border-t border-[var(--border-color)]"
          >
            <div
              v-for="device in connectedDevices"
              :key="device.id"
              class="text-xs text-[var(--text-secondary)] flex items-center gap-2"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"
              ></span>
              <span>{{ device.name }}</span>
            </div>
          </div>
        </div>

        <!-- 链接地址 -->
        <div
          v-if="qrUrl"
          class="w-full px-3 py-3 bg-[var(--bg-secondary)] rounded"
        >
          <div class="flex justify-between items-center text-xs text-[var(--text-tertiary)] mb-2">
            <span>连接地址：</span>
            <NButton text size="small" @click="handleCopyLink" title="复制链接">
              复制
            </NButton>
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="qrUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 text-xs text-[var(--color-primary)] break-all leading-relaxed hover:underline"
            >
              {{ qrUrl }}
            </a>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="w-full flex gap-2 justify-center">
          <NButton secondary @click="handleRefresh"> 刷新二维码 </NButton>
        </div>

        <!-- 使用提示 -->
        <div class="w-full px-3 py-3 bg-[var(--bg-secondary)] rounded">
          <div class="text-xs text-[var(--text-secondary)] leading-relaxed">
            <div>💡 使用手机浏览器扫描二维码</div>
            <div>📝 连接后可快速发送笔记到扩展</div>
            <div>🔒 点对点加密传输，安全可靠</div>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style lang="scss" scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
