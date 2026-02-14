<script setup>
import { ref, computed } from 'vue';
import { NSlider } from 'naive-ui';
import UseageView from '../Panels/UseageView.vue';
import IconSkipPrevious from '@/components/common/Icons/IconSkipPrevious.vue';
import IconSkipNext from '@/components/common/Icons/IconSkipNext.vue';
import { useImageBrightness } from '@/composables/shareCard/useImageBrightness';

const props = defineProps({
  coverUrl: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  artist: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['upload-cover']);

// 进度条值（静态，不可交互）
const progress = ref(28);

// 计算背景图片亮度
const { isDark } = useImageBrightness(() => props.coverUrl, {
  threshold: 170,
});

// 背景样式（有封面时使用封面作为模糊背景）
const backgroundStyle = computed(() => {
  if (props.coverUrl) {
    return { backgroundImage: `url(${props.coverUrl})` };
  }
  return {};
});

// 触发上传背景图
const handlePlayerCardClick = () => {
  emit('upload-cover');
};
</script>

<template>
  <div
    class="music-card-player-wrapper relative flex flex-col w-[402px] h-[524px] overflow-hidden"
  >
    <!-- 背景层 -->
    <div
      class="background-layer absolute inset-0 z-[1]"
      :class="{ active: coverUrl, bright: !isDark }"
      :style="backgroundStyle"
    ></div>

    <!-- 卡片内容 -->
    <div
      class="content-layer relative z-10 flex flex-col h-full px-6 pt-6 pb-5"
    >
      <!-- 顶部播放器卡片（横向布局） -->
      <div
        class="player-card bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-lg cursor-pointer transition-all hover:shadow-xl"
        @click="handlePlayerCardClick"
      >
        <div class="flex gap-4">
          <!-- 左侧封面 -->
          <div
            class="cover-container flex-none size-[96px] rounded-lg overflow-hidden"
          >
            <img
              v-if="coverUrl"
              :src="coverUrl"
              alt="专辑封面"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-gray-200 flex items-center justify-center"
            >
              <span class="text-xs text-gray-400">封面</span>
            </div>
          </div>

          <!-- 右侧控制区 -->
          <div class="flex-1 flex flex-col justify-between min-w-0 py-1 pr-2">
            <!-- 歌曲信息 -->
            <div class="song-info">
              <div
                class="song-title text-[15px] font-medium text-gray-900 truncate"
              >
                {{ title || '标题' }}
              </div>
              <div class="artist-name text-[13px] text-gray-600 truncate">
                {{ artist || '艺术家' }}
              </div>
            </div>

            <!-- 进度条 -->
            <div class="progress-section">
              <NSlider
                v-model:value="progress"
                :step="1"
                :tooltip="false"
                :disabled="true"
                class="player-slider pointer-events-none"
              />
            </div>

            <!-- 播放控制按钮 -->
            <div
              class="control-buttons flex items-center justify-center gap-8 pointer-events-none"
            >
              <IconSkipPrevious class="text-gray-900 text-2xl" />
              <div class="pause-button flex flex-col gap-0.5">
                <div class="w-1 h-4 bg-black rounded"></div>
                <div class="w-1 h-4 bg-black rounded"></div>
              </div>
              <IconSkipNext class="text-gray-900 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <!-- 中间区域 -->
      <div
        class="middle-section flex-1 flex flex-col items-center justify-center relative w-52 m-auto py-6"
      >
        <!-- 可编辑文字 -->
        <div
          class="text-content relative z-10 flex flex-col justify-center items-center gap-2 size-full text-[15px]"
          :class="[isDark ? 'text-white/85' : ' text-black/75']"
          contenteditable="true"
        ></div>
      </div>

      <!-- 交互面板 -->
      <UseageView />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-card-player-wrapper {
  // 背景层样式
  .background-layer {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: scale(1.1);

    &.active {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(12px);
    }

    // 高亮背景时添加深色遮罩
    &.bright::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      background-color: var(--color-black-alpha-6);
    }
  }

  .content-layer {
    .player-card {
      &:hover {
        transform: translateY(-2px);
      }
    }

    .middle-section {
      .text-content {
        .greeting-text,
        .message-text {
          outline: none;
          transition: all 0.2s ease;

          &:hover {
            opacity: 0.8;
          }

          &:focus {
            outline: 2px solid rgba(255, 255, 255, 0.3);
            outline-offset: 4px;
            border-radius: 4px;
          }
        }
      }
    }
  }
}

// 播放器进度条样式
.player-slider {
  :deep(.n-slider-handle) {
    width: 8px !important;
    height: 8px !important;
    background-color: #000 !important;
  }

  :deep(.n-slider-rail) {
    background-color: #ccc !important;
    height: 2px !important;
  }

  :deep(.n-slider-rail__fill) {
    background-color: #000 !important;
    height: 2px !important;
  }

  &.n-slider--disabled {
    opacity: 0.9 !important;
  }
}

// 暂停按钮样式
.pause-button {
  display: flex;
  flex-direction: row;
  gap: 4px;
}
</style>
