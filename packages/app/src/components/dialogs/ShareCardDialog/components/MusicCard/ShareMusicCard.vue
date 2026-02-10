<script setup>
import { ref, watch, computed } from 'vue'
import { NButton, NSlider, NInput, useMessage } from 'naive-ui'
import QRCode from 'qrcode'
import { formatDate } from '@linxs/toolkit'
import ShareControlPanel from '../ShareControlPanel.vue'

const props = defineProps({
  // 不可修改数据
  name: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  // 可修改数据
  cover: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: 50
  },
  lyrics: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['update:cover', 'update:progress', 'update:lyrics'])

const message = useMessage()

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

// 封面上传
const coverUrl = ref(props.cover)
const fileInputRef = ref(null)

watch(
  () => props.cover,
  (newCover) => {
    coverUrl.value = newCover
  }
)

const handleCoverUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    message.error('请上传图片文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    coverUrl.value = e.target.result
    emit('update:cover', e.target.result)
    message.success('封面已更新')
  }
  reader.readAsDataURL(file)
}

const triggerCoverUpload = () => {
  fileInputRef.value?.click()
}

// 进度条
const currentProgress = ref(props.progress)

watch(
  () => props.progress,
  (newProgress) => {
    currentProgress.value = newProgress
  }
)

const handleProgressChange = (value) => {
  currentProgress.value = value
  emit('update:progress', value)
}

// 歌词编辑
const showLyricsInput = ref(false)
const lyricsText = ref(props.lyrics.join('\n'))

watch(
  () => props.lyrics,
  (newLyrics) => {
    lyricsText.value = newLyrics.join('\n')
  }
)

const handleLyricsConfirm = () => {
  const lines = lyricsText.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    message.warning('歌词至少需要2行')
    return
  }

  if (lines.length > 6) {
    message.warning('歌词最多6行，已截取前6行')
    emit('update:lyrics', lines.slice(0, 6))
  } else {
    emit('update:lyrics', lines)
  }

  showLyricsInput.value = false
  message.success('歌词已更新')
}

// 计算封面容器尺寸（根据卡片尺寸自适应）
const coverContainerSize = computed(() => {
  const minDimension = Math.min(cardSize.value.width, cardSize.value.height)
  // 封面占卡片宽度的 80%，但不超过卡片高度的 50%
  const maxSize = Math.min(
    cardSize.value.width * 0.8,
    cardSize.value.height * 0.5
  )
  return Math.min(minDimension * 0.7, maxSize)
})
</script>

<template>
  <div class="music-card-wrapper flex flex-col gap-4">
    <!-- 卡片主体 -->
    <div
      class="music-card-content bg-white rounded-xl overflow-hidden shadow-lg relative"
      :style="{
        width: `${cardSize.width}px`,
        height: `${cardSize.height}px`
      }"
    >
      <div class="h-full flex flex-col">
        <!-- 封面区域（可点击上传） -->
        <div class="cover-section flex-1 flex items-center justify-center p-6">
          <div
            class="cover-container relative cursor-pointer group"
            :style="{ width: `${coverContainerSize}px`, height: `${coverContainerSize}px` }"
            @click="triggerCoverUpload"
          >
            <img
              v-if="coverUrl"
              :src="coverUrl"
              alt="封面"
              class="w-full h-full object-cover rounded-lg shadow-lg"
            />
            <div
              v-else
              class="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"
            >
              <span class="text-gray-400 text-sm">点击上传封面</span>
            </div>

            <!-- 悬浮提示 -->
            <div
              class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
            >
              <span class="text-white text-sm">点击更换封面</span>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleCoverUpload"
            />
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="info-section px-6 pb-6">
          <!-- 歌曲信息 -->
          <div class="text-center mb-4">
            <h3 class="text-xl font-bold text-gray-800 mb-1">{{ name }}</h3>
            <p class="text-sm text-gray-500">{{ artist }}</p>
          </div>

          <!-- 播放进度 -->
          <div class="mb-4">
            <NSlider
              v-model:value="currentProgress"
              :step="1"
              :min="0"
              :max="100"
              @update:value="handleProgressChange"
            />
            <div class="text-xs text-center text-gray-400 mt-1">
              {{ currentProgress }}%
            </div>
          </div>

          <!-- 歌词显示 -->
          <div
            v-if="lyrics.length > 0 && !showLyricsInput"
            class="lyrics-display mb-3"
          >
            <p
              v-for="(line, index) in lyrics"
              :key="index"
              class="text-sm text-gray-600 text-center leading-relaxed"
            >
              {{ line }}
            </p>
          </div>

          <!-- 歌词输入 -->
          <div v-if="showLyricsInput" class="lyrics-input mb-3">
            <NInput
              v-model:value="lyricsText"
              type="textarea"
              placeholder="输入歌词，每行一句（2-6行）"
              :rows="6"
              maxlength="300"
              show-count
            />
            <div class="flex gap-2 mt-2">
              <NButton size="small" type="primary" @click="handleLyricsConfirm">
                确定
              </NButton>
              <NButton size="small" @click="showLyricsInput = false">
                取消
              </NButton>
            </div>
          </div>

          <!-- 歌词按钮 -->
          <div v-if="!showLyricsInput" class="text-center">
            <NButton size="small" @click="showLyricsInput = true">
              {{ lyrics.length > 0 ? '修改歌词' : '选择歌词' }}
            </NButton>
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
      :available-sizes="['player', 'square', 'card-h']"
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
.music-card-content {
  transition: all 0.3s ease;
}

.cover-container {
  transition: all 0.3s ease;
}

.lyrics-display {
  min-height: 40px;
  max-height: 120px;
  overflow-y: auto;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
}
</style>
