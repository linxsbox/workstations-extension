<script setup>
import { ref, watch, nextTick } from 'vue';
import { NModal, NButton, NSpin } from 'naive-ui';
import QRCode from 'qrcode';

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
    default: '未初始化',
  },
  connectedDevices: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:show', 'refresh']);

const qrcodeCanvas = ref(null);
const isGenerating = ref(false);

// 监听二维码 URL 变化，自动生成二维码
watch(
  () => props.qrUrl,
  async (newUrl) => {
    if (newUrl && props.show) {
      await nextTick();
      generateQRCode();
    }
  },
  { immediate: true }
);

// 监听弹窗显示状态
watch(
  () => props.show,
  async (show) => {
    if (show && props.qrUrl) {
      await nextTick();
      generateQRCode();
    }
  }
);

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

// 关闭弹窗
const handleClose = (value) => {
  emit('update:show', value);
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
    // TODO: 显示成功提示
  } catch (error) {
    console.error('[QRCode Dialog] 复制失败:', error);
  }
};

// 计算状态颜色
const getStatusColor = () => {
  if (props.status === '未初始化') return '#999';
  if (props.connectedDevices.length > 0) return '#18a058'; // 已连接：绿色
  return '#f0a020'; // 等待连接：橙色
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
      <div v-if="status === '未初始化'" class="flex flex-col items-center gap-4 p-4 w-full">
        <div class="text-5xl">📱</div>
        <div class="text-lg font-semibold text-[var(--text-primary)]">手机同步</div>
        <div class="text-sm text-[var(--text-secondary)] text-center leading-relaxed">
          WebRTC 正在初始化，请稍候...
        </div>
        <div class="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>

      <!-- 已初始化：显示二维码 -->
      <div v-else class="flex flex-col items-center gap-4 w-full">
        <!-- 二维码显示区域 -->
        <div class="relative w-64 h-64 flex items-center justify-center rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)]">
          <NSpin :show="isGenerating">
            <canvas ref="qrcodeCanvas" class="block max-w-full max-h-full"></canvas>
          </NSpin>
        </div>

        <!-- 连接状态信息 -->
        <div class="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded flex flex-col gap-2.5">
          <!-- 第一行：连接状态 -->
          <div class="flex items-center justify-center gap-2">
            <div
              class="w-2 h-2 rounded-full animate-pulse"
              :style="{ backgroundColor: getStatusColor() }"
            ></div>
            <span class="text-sm font-medium" :style="{ color: getStatusColor() }">
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
          <div v-if="connectedDevices.length > 0" class="mt-2 pt-2 border-t border-[var(--border-color)]">
            <div
              v-for="device in connectedDevices"
              :key="device.id"
              class="text-xs text-[var(--text-secondary)] flex items-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span>
              <span>{{ device.name }}</span>
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
          >
            刷新二维码
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
