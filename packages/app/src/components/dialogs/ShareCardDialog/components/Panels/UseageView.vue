<script setup>
import { computed, inject, watch, onMounted, nextTick } from 'vue';
import { formatDate } from '@linxs/toolkit';
import { useQRCode } from '@/composables/shareCard/useQRCode';
import { DEFAULT_CARD_CONTROL_STATE } from '@/composables/shareCard/useControlPanel';

const props = defineProps({});

// 注入共享的卡片控制状态（提供默认值）
const cardControlState = inject('cardControlState', DEFAULT_CARD_CONTROL_STATE);

// 使用二维码 composable
const { qrCodeUrl, generateQRCode } = useQRCode();

// 二维码配置
const QR_OPTIONS = {
  width: 200, // 生成高分辨率二维码，通过 CSS 缩放显示
  height: 200,
  margin: 2, // 适当的边距
  errorCorrectionLevel: 'M', // 中等纠错级别
};

// 生成二维码的辅助函数
const tryGenerateQRCode = async () => {
  console.log(cardControlState.qrcode);

  if (cardControlState.qrcode) {
    await generateQRCode(cardControlState.qrcode, QR_OPTIONS);
  }
};

// 初始化时生成二维码
onMounted(async () => {
  cardControlState.qrcode = '';
  await nextTick();
  tryGenerateQRCode();
});

// 监听二维码文本变化，自动重新生成
watch(
  () => cardControlState.qrcode,
  async (newQrcode) => {
    if (newQrcode) {
      await generateQRCode(newQrcode, QR_OPTIONS);
    }
  }
);

const time = computed(() => formatDate(new Date(), 'YYYY年MM月DD日 HH:mm'));
</script>

<template>
  <div class="useage-wrapper flex justify-between items-end gap-4 w-full">
    <div
      class="inline-flex flex-col gap-0.5 overflow-hidden"
      :style="{ textAlign: cardControlState.textAlign }"
    >
      <div
        class="signature-text text-[15px] text-orange-100 truncate"
        v-if="cardControlState.isSignatureShow && cardControlState.signature"
      >
        {{ cardControlState.signature }}
      </div>
      <div class="time text-xs">@林小帅 {{ time }}</div>
    </div>
    <div
      class="qrcode-wrapper flex-none rounded overflow-hidden"
      v-if="cardControlState.isQrcodeShow"
    >
      <img
        v-if="qrCodeUrl"
        :src="qrCodeUrl"
        alt="QR Code"
        class="w-[48px] h-[48px]"
      />
      <div
        v-else
        class="w-[48px] h-[48px] flex items-center justify-center bg-gray-200 text-xs text-gray-500"
      >
        二维码
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.useage-wrapper {
  .time {
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>
