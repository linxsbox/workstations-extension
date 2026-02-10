<script setup>
import { ref, watch, computed } from 'vue'
import QRCode from 'qrcode'
import { formatDate } from '@linxs/toolkit'
import ShareControlPanel from './Panels/ControlView.vue'

const props = defineProps({
  // 文本内容
  content: {
    type: String,
    required: true
  },
  // 二维码配置
  qrcodeContent: {
    type: String,
    default: ''
  },
  qrcodeSize: {
    type: Number,
    default: 80
  }
})

// 卡片尺寸（从控制面板获取）
const cardSize = ref({ width: 640, height: 640 })

// 底部信息控制
const enableSignature = ref(true)
const enableDate = ref(true)
const enableQrcode = ref(true)
const signature = ref('')
const textAlign = ref('left')

// 当前日期
const currentDate = computed(() => formatDate(new Date(), 'YYYY年MM月DD日'))

// 二维码
const qrcodeDataUrl = ref('')
const generateQRCode = async () => {
  if (!props.qrcodeContent || !enableQrcode.value) {
    qrcodeDataUrl.value = ''
    return
  }

  try {
    const dataUrl = await QRCode.toDataURL(props.qrcodeContent, {
      width: props.qrcodeSize,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    qrcodeDataUrl.value = dataUrl
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

watch(enableQrcode, generateQRCode)
watch(() => props.qrcodeContent, generateQRCode, { immediate: true })
</script>

<template>
  <div class="text-card-wrapper flex flex-col gap-4">
    <!-- 卡片主体 -->
    <div
      class="text-card-content bg-white rounded-xl overflow-hidden shadow-lg relative"
      :style="{
        width: `${cardSize.width}px`,
        height: `${cardSize.height}px`
      }"
    >
      <div class="h-full flex flex-col">
        <!-- 文本内容区域 -->
        <div class="content-section flex-1 p-6 overflow-y-auto">
          <div
            class="text-base leading-relaxed text-gray-700 whitespace-pre-wrap"
            :style="{ textAlign: textAlign }"
          >
            {{ content }}
          </div>
        </div>
      </div>

      <!-- 底部信息栏 -->
      <div
        v-if="enableSignature || enableDate || enableQrcode"
        class="absolute bottom-0 left-0 right-0 flex justify-between items-end px-6 pb-5"
      >
        <!-- 左侧：签名和日期 -->
        <div class="flex flex-col gap-2" :style="{ textAlign: textAlign }">
          <div
            v-if="enableSignature && signature"
            class="text-sm text-zinc-700"
          >
            {{ signature }}
          </div>
          <div v-if="enableDate" class="text-xs text-gray-400">
            {{ currentDate }}
          </div>
        </div>

        <!-- 右侧：二维码 -->
        <div v-if="enableQrcode && qrcodeDataUrl">
          <img
            :src="qrcodeDataUrl"
            alt="二维码"
            :style="{
              width: `${qrcodeSize}px`,
              height: `${qrcodeSize}px`
            }"
            class="border-2 border-gray-200 rounded"
          />
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <ShareControlPanel
      :available-sizes="['phone', 'player', 'card-h', 'card-v', 'square']"
      default-size="square"
      @update:size="cardSize = $event"
      @update:signature="signature = $event"
      @update:text-align="textAlign = $event"
      @update:enable-signature="enableSignature = $event"
      @update:enable-date="enableDate = $event"
      @update:enable-qrcode="enableQrcode = $event"
    />
  </div>
</template>

<style lang="scss" scoped>
.text-card-content {
  transition: all 0.3s ease;
}

.content-section {
  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
}
</style>
