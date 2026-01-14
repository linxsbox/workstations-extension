<script setup>
import { ref, computed } from 'vue';
import { NInput, NRadioGroup, NRadioButton, NButton, NModal, useMessage } from 'naive-ui';
import { clipboard } from '@linxs/toolkit';
import QRCode from 'qrcode';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  qrcodeContent: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:show', 'close']);

const message = useMessage();

// 控制面板状态
const signature = ref('');
const textAlign = ref('left');
const qrcodeDataUrl = ref('');

// 当前日期
const currentDate = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
});

// 生成二维码
const generateQRCode = async () => {
  try {
    const dataUrl = await QRCode.toDataURL(props.qrcodeContent, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    qrcodeDataUrl.value = dataUrl;
  } catch (error) {
    console.error('生成二维码失败:', error);
    message.error('生成二维码失败');
  }
};

// 初始化时生成二维码
generateQRCode();

// 复制卡片为图片
const copyCardAsImage = async () => {
  try {
    // 使用 snapdom 将卡片转换为图片
    const { snapdom } = await import('@zumer/snapdom');
    const cardElement = document.querySelector('.share-card-content');

    if (!cardElement) {
      throw new Error('未找到卡片元素');
    }

    // 使用 snapdom.toCanvas 生成 canvas
    const canvas = await snapdom.toCanvas(cardElement, {
      scale: 2,
      compress: true,
      fast: true,
      embedFonts: false,
      backgroundColor: '#ffffff',
      dpr: window.devicePixelRatio || 1,
    });

    // 将 canvas 转换为 blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
    });

    // 使用升级后的 clipboard 工具复制图片
    await clipboard({
      type: 'blob',
      data: { 'image/png': blob },
      success: async (msg) => {
        message.success(msg);
      },
      error: async (msg) => {
        message.error(msg);
      },
    });
  } catch (error) {
    console.error('生成图片失败:', error);
    message.error('生成图片失败');
  }
};

// 关闭
const handleClose = () => {
  emit('update:show', false);
  emit('close');
};
</script>

<template>
  <NModal
    :show="show"
    @update:show="handleClose"
    :bordered="false"
    :closable="false"
    :show-icon="false"
    :mask-closable="true"
    transform-origin="center"
    class="share-card-modal"
  >
    <div class="flex flex-col items-center gap-5 p-5">
      <!-- 卡片主体 -->
      <div class="share-card-content w-[420px] bg-white rounded-xl overflow-hidden shadow-lg">
        <!-- 图片区域 -->
        <div class="w-full flex justify-center items-center p-5">
          <img :src="image" alt="分享图片" class="w-[380px] h-[380px] object-cover rounded-lg shadow-md" />
        </div>

        <!-- 分享内容 -->
        <div
          class="px-6 py-4 text-base leading-relaxed text-gray-800"
          :style="{ textAlign: textAlign }"
        >
          {{ content }}
        </div>

        <!-- 底部信息栏 -->
        <div class="flex justify-between items-end px-6 py-5">
          <!-- 左侧：签名和日期 -->
          <div class="flex flex-col gap-2">
            <div v-if="signature" class="text-sm font-semibold text-gray-800">{{ signature }}</div>
            <div class="text-xs text-gray-600">{{ currentDate }}</div>
          </div>

          <!-- 右侧：二维码 -->
          <div class="flex items-center">
            <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="二维码" class="w-20 h-20 border-2 border-gray-200 rounded" />
          </div>
        </div>
      </div>

      <!-- 控制面板 -->
      <div class="flex flex-col gap-3 w-[420px] p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
        <!-- 第一行：签名输入和对齐方式 -->
        <div class="flex gap-3 items-center">
          <NInput
            v-model:value="signature"
            placeholder="输入签名（最多20字）"
            maxlength="20"
            show-count
            class="flex-1"
          />
          <NRadioGroup v-model:value="textAlign" class="flex-shrink-0">
            <NRadioButton value="left">左</NRadioButton>
            <NRadioButton value="center">中</NRadioButton>
            <NRadioButton value="right">右</NRadioButton>
          </NRadioGroup>
        </div>

        <!-- 第二行：操作按钮 -->
        <div class="flex gap-3 justify-end">
          <NButton type="primary" @click="copyCardAsImage">复制</NButton>
          <NButton @click="handleClose">关闭</NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style lang="scss" scoped>
// Modal 透明样式
:deep(.share-card-modal) {
  background: transparent;
  box-shadow: none;
  padding: 0;
}
</style>
