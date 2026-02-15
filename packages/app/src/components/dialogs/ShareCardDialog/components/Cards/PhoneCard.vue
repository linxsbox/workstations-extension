<script setup>
import { computed, ref } from 'vue';
import { NSlider } from 'naive-ui';
import PlayButton from '@/components/player/PlayButton.vue';
import IconRepeat from '@/components/common/Icons/IconRepeat.vue';
import IconSkipPrevious from '@/components/common/Icons/IconSkipPrevious.vue';
import IconSkipNext from '@/components/common/Icons/IconSkipNext.vue';
import IconPlaylistPlay from '@/components/common/Icons/IconPlaylistPlay.vue';
import IconFavoriteBorder from '@/components/common/Icons/IconFavoriteBorder.vue';
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

const emit = defineEmits(['upload-cover', 'select-lyrics']);

const progress = ref(50);
const playOffset = computed(() => 100 - progress.value);

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

// 触发上传封面事件
const handleCoverClick = () => {
  emit('upload-cover');
};

// 触发选择歌词事件
const handleLyricsClick = () => {
  emit('select-lyrics');
};
</script>

<template>
  <div
    class="music-card-phone-wrapper relative flex flex-col gap-4 w-[402px] h-[874px] overflow-hidden"
  >
    <!-- 背景层 -->
    <div
      class="background-layer absolute top-0 left-0 right-0 bottom-0 inset-0 z-[1]"
      :class="{ active: coverUrl, bright: !isDark }"
      :style="backgroundStyle"
    ></div>

    <div class="h-12"></div>

    <!-- 卡片内容 -->
    <div
      class="content-layer relative z-10 flex flex-col gap-4 p-4 h-full rounded-2xl"
    >
      <!-- 封面区域 -->
      <div
        class="cover-section flex-none flex justify-center items-center rounded-2xl overflow-hidden"
      >
        <div
          class="cover-container relative size-[370px] transition-opacity cursor-pointer"
          @click="handleCoverClick"
        >
          <img
            v-if="coverUrl"
            :src="coverUrl"
            alt="专辑封面"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <span class="text-sm">{{ '专辑封面' }}</span>
          </div>
        </div>
      </div>

      <!-- 歌曲信息区域 -->
      <div class="song-info-section flex-1 flex flex-col gap-2 px-2">
        <!-- 标题和艺术家 -->
        <div class="song-meta flex flex-col gap-1">
          <!-- 标题 -->
          <div class="title-text text-xl font-bold truncate">{{ title || '标题'}}</div>
          <!-- 艺术家 -->
          <div class="artist-text text-base truncate">{{ artist || '艺术家'}}</div>
        </div>

        <!-- 歌词 -->
        <div
          class="lyrics-text text-sm text-gray-400 italic mt-2 transition-colors whitespace-pre-line"
          @click="handleLyricsClick"
        >
          歌词
        </div>
      </div>

      <!-- 进度条区域 -->
      <div class="progress-section relative flex-none">
        <NSlider
          v-model:value="progress"
          :step="1"
          :tooltip="false"
          class="progress-slider"
        />

        <div class="absolute right-0 bottom-6">
          <IconFavoriteBorder class="text-white opacity-90 text-[32px]" />
          <div class="absolute -top-2 -right-3 text-white text-xs">999+</div>
        </div>
      </div>

      <!-- 播放控制区域 -->
      <div
        class="control-section flex-none flex items-center justify-center gap-6 mt-2 mb-16 text-[48px]"
      >
        <IconRepeat class="text-white opacity-85 text-[inheiit]" />
        <IconSkipPrevious class="text-white opacity-85 text-[inheiit]" />
        <PlayButton
          class="play-button text-white text-5xl text-[50px]"
          :offset="playOffset"
          isPlay
          isDisabled
        />
        <IconSkipNext class="text-white opacity-85 text-[inheiit]" />
        <IconPlaylistPlay class="text-white opacity-85 text-[inheiit]" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-card-phone-wrapper {
  // 背景层样式
  .background-layer {
    background-color: #484b52;
    transform: scale(1.1);

    &.active {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      // 高斯模糊效果
      filter: blur(48px);
      backdrop-filter: blur(0px);
      // 稍微放大背景，避免模糊后边缘出现空白
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
    .cover-container {
      background-color: var(--color-white-alpha-2);
    }

    .cover-section {
      box-shadow: 1px 1px 6px 4px rgba(0, 0, 0, 0.12);
    }

    .song-info-section {
      .title-text {
        color: rgba(255, 255, 255, 0.9);
      }

      .artist-text {
        color: var(--color-white-alpha-1);
      }

      .lyrics-text {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

// 覆盖 NSlider 样式
.progress-slider {
  :deep(.n-slider-handle) {
    width: 6px !important;
    border-radius: 24px !important;
  }

  :deep(.n-slider-rail) {
    background-color: #999 !important;
  }

  :deep(.n-slider-rail__fill) {
    background-color: #fff !important;
  }
}
</style>
