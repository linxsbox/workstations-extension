<script setup>
import { ref, watch, nextTick } from 'vue';
import { NModal, NButton, NCard, NSpin } from 'naive-ui';
import QRCode from 'qrcode';
import { CONNECTION_STATUS } from '@/services/webrtc/constants';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  qrUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: CONNECTION_STATUS.IDLE,
  },
  connectedDevices: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['update:show', 'start-sync', 'stop-sync', 'refresh']);

const qrcodeCanvas = ref(null);
const isGenerating = ref(false);

// 状态文本映射
const statusTextMap = {
  [CONNECTION_STATUS.IDLE]: '未初始化',
  [CONNECTION_STATUS.INITIALIZING]: '初始化中...',
  [CONNECTION_STATUS.READY]: '等待手机扫码连接',
  [CONNECTION_STATUS.CONNECTING]: '连接中...',
  [CONNECTION_STATUS.CONNECTED]: '已连接',
  [CONNECTION_STATUS.DISCONNECTED]: '连接已断开',
  [CONNECTION_STATUS.ERROR]: '连接错误',
};

// 状态颜色映射
const statusColorMap = {
  [CONNECTION_STATUS.IDLE]: 'var(--text-tertiary)',
  [CONNECTION_STATUS.INITIALIZING]: 'var(--color-warning)',
  [CONNECTION_STATUS.READY]: 'var(--color-info)',
  [CONNECTION_STATUS.CONNECTING]: 'var(--color-warning)',
  [CONNECTION_STATUS.CONNECTED]: 'var(--color-success)',
  [CONNECTION_STATUS.DISCONNECTED]: 'var(--text-tertiary)',
  [CONNECTION_STATUS.ERROR]: 'var(--color-error)',
};

// 生成二维码
const generateQRCode = async () => {
  if (!props.qrUrl || !qrcodeCanvas.value) {
    console.warn('[QRCode Dialog] 缺少必要条件，跳过生成');
    return;
  }

  isGenerating.value = true;

  try {
    await QRCode.toCanvas(qrcodeCanvas.value, props.qrUrl, {
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
  } finally {
    isGenerating.value = false;
  }
};

// 监听弹窗显示和 URL 变化
watch([() => props.show, () => props.qrUrl], async ([show, url]) => {
  if (show && url) {
    await nextTick(); // 等待 DOM 更新
    generateQRCode();
  }
});

// 监听 status 变化到 READY 时生成二维码
watch(() => props.status, async (newStatus) => {
  if (newStatus === CONNECTION_STATUS.READY && props.qrUrl && props.show) {
    await nextTick();
    generateQRCode();
  }
});

// 关闭弹窗
const handleClose = (value) => {
  emit('update:show', value);
};

// 开启同步
const handleStartSync = async () => {
  emit('start-sync');
};

// 停止同步
const handleStopSync = async () => {
  emit('stop-sync');
};

// 刷新二维码
const handleRefresh = () => {
  emit('refresh');
};

// 复制链接
const handleCopyLink = async () => {
  if (!props.qrUrl) return;

  try {
    await navigator.clipboard.writeText(props.qrUrl);
    console.log('[QRCode Dialog] 链接已复制');
  } catch (error) {
    console.error('[QRCode Dialog] 复制失败:', error);
  }
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
      <!-- 未初始化状态：显示开启同步按钮 -->
      <div v-if="status === CONNECTION_STATUS.IDLE" class="flex flex-col items-center gap-4 p-4 w-full">
        <div class="text-5xl">📱</div>
        <div class="text-lg font-semibold text-[var(--text-primary)]">手机同步</div>
        <div class="text-sm text-[var(--text-secondary)] text-center leading-relaxed">
          点击下方按钮开启同步，然后用手机扫描二维码快速连接
        </div>
        <NButton
          type="primary"
          size="large"
          @click="handleStartSync"
          class="w-full mt-2"
        >
          开启同步
        </NButton>
      </div>

      <!-- 初始化中状态 -->
      <div v-else-if="status === CONNECTION_STATUS.INITIALIZING" class="flex justify-center items-center py-16 px-5 w-full">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
          <div class="text-sm text-[var(--text-secondary)]">初始化中...</div>
        </div>
      </div>

      <!-- 已初始化状态：显示二维码和连接信息 -->
      <div v-else class="flex flex-col items-center gap-4 w-full">
        <!-- 二维码显示区域 -->
        <div class="relative w-64 h-64 flex items-center justify-center rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <NSpin :show="isGenerating">
            <canvas ref="qrcodeCanvas" class="block max-w-full max-h-full"></canvas>
          </NSpin>
        </div>

        <!-- 连接状态信息（两行布局） -->
        <div class="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded flex flex-col gap-2.5">
          <!-- 第一行：连接状态 -->
          <div class="flex items-center justify-center gap-2">
            <div
              class="w-2 h-2 rounded-full animate-pulse"
              :style="{ backgroundColor: statusColorMap[status] }"
            ></div>
            <span class="text-sm font-medium" :style="{ color: statusColorMap[status] }">
              {{ statusTextMap[status] }}
            </span>
          </div>

          <!-- 第二行：服务状态 | 已连接设备 -->
          <div class="flex items-center justify-center gap-3 text-xs">
            <!-- 服务状态 -->
            <div class="flex items-center gap-1.5">
              <span class="text-[var(--text-secondary)]">服务：</span>
              <span class="text-[var(--text-primary)] font-medium">
                {{ status === CONNECTION_STATUS.CONNECTED ? '运行中' : '待连接' }}
              </span>
            </div>

            <!-- 分隔符 -->
            <div class="w-px h-3 bg-[var(--border-color)]"></div>

            <!-- 已连接设备 -->
            <div class="flex items-center gap-1.5">
              <span class="text-[var(--text-secondary)]">设备：</span>
              <span class="text-[var(--text-primary)] font-medium">{{ connectedDevices }} 台</span>
            </div>
          </div>
        </div>

        <!-- 链接地址 -->
        <div v-if="qrUrl" class="w-full px-3 py-3 bg-[var(--bg-secondary)] rounded">
          <div class="text-xs text-[var(--text-tertiary)] mb-2">连接地址：</div>
          <div class="flex items-center gap-2">
            <a
              :href="qrUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 text-xs text-[var(--color-primary)] break-all leading-relaxed hover:underline"
            >
              {{ qrUrl }}
            </a>
            <NButton
              text
              size="small"
              @click="handleCopyLink"
              title="复制链接"
            >
              复制
            </NButton>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="w-full flex gap-2 justify-center">
          <NButton
            secondary
            @click="handleRefresh"
            :disabled="status === CONNECTION_STATUS.INITIALIZING || status === CONNECTION_STATUS.CONNECTING"
          >
            刷新二维码
          </NButton>
          <NButton
            type="error"
            @click="handleStopSync"
            :disabled="status === CONNECTION_STATUS.INITIALIZING"
          >
            停止同步
          </NButton>
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
  0%, 100% {
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
