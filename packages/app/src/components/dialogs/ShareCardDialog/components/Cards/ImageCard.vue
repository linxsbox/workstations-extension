<script setup>
import { computed } from 'vue';
import UseageView from '../Panels/UseageView.vue';
import PlayButton from '@/components/player/PlayButton.vue';
import IconPlaylistPlay from '@/components/common/Icons/IconPlaylistPlay.vue';

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
</script>

<template>
  <div
    class="music-card-image-wrapper relative flex flex-col gap-4 w-[402px] h-[524px] overflow-hidden"
  >
    <!-- 背景层 -->
    <div
      class="background-layer absolute top-0 left-0 right-0 bottom-0 inset-0 z-[1]"
      :class="{ active: coverUrl }"
      :style="backgroundStyle"
    ></div>

    <!-- 卡片内容 -->
    <div
      class="content-layer relative z-10 flex-1 flex flex-col justify-between gap-4 px-9 pt-14 pb-6 h-full"
    >
      <!-- 封面区域 -->
      <div
        class="cover-section relative flex-none flex flex-col justify-center items-center rounded-2xl overflow-hidden"
      >
        <div
          class="cover-container size-[330px] transition-opacity cursor-pointer"
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

        <!-- 歌曲信息区域 -->
        <div
          class="song-info-section absolute bottom-0 w-full h-10 flex justify-between items-center gap-3 pl-[52px] pr-1 py-2 bg-white"
        >
          <div
            class="record absolute left-0.5 bottom-0.5 size-11 rounded-full flex justify-center items-center overflow-hidden"
          >
            <img
              v-if="coverUrl"
              class="record-cd size-[26px] rounded-full"
              :src="coverUrl"
              alt=""
            />
            <div
              v-else
              class="record-cd size-6 rounded-full bg-slate-300"
            ></div>
          </div>

          <!-- 标题和艺术家 -->
          <div class="song-meta flex justify-center items-center gap-1 overflow-hidden">
            <!-- 标题 -->
            <div class="title-text text-base truncate">{{ title || '标题' }}</div>
            <span>-</span>
            <!-- 艺术家 -->
            <div class="artist-text text-xs truncate pt-1 opacity-80">
              {{ artist || '艺术家' }}
            </div>
          </div>

          <div
            class="control-section flex-none flex items-center justify-center gap-4"
          >
            <PlayButton
              class="play-button text-gray-950 text-[22px]"
              :offset="75"
              isPlay
              isDisabled
            />
            <IconPlaylistPlay class="text-gray-950 opacity-85 text-3xl" />
          </div>
        </div>
      </div>

      <!-- 交互面板 -->
      <UseageView />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-card-image-wrapper {
  // 背景层样式
  .background-layer {
    background-color: #484b52;
    transform: scale(1.1);

    &::after {
      content: '';
      position: inherit;
      top: inherit;
      left: inherit;
      right: inherit;
      bottom: inherit;
      width: inherit;
      height: inherit;
      z-index: 1;
      background-color: var(--color-black-alpha-3);
    }

    &.active {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      // 高斯模糊效果
      filter: blur(24px);
      backdrop-filter: blur(0px);
      // 稍微放大背景，避免模糊后边缘出现空白
    }
  }

  .content-layer {
    .cover-container {
      background-color: var(--color-white-alpha-2);
    }

    .cover-section {
      border-width: 4px;
      border-width: 3.5px;
      border-style: solid;
      border-color: #fff;
    }

    .record {
      border: 3px solid #fff;
      background-color: #000;

      .record-cd {
        transform: translate3d(0px, 0px, 0);
      }
    }
  }
}
</style>
