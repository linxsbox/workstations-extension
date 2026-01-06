<script setup>
import { ref } from 'vue';
import PlayerCover from '../PlayerCover.vue';
import PlayerInfo from '../PlayerInfo.vue';
import PlayerProgressBar from '../PlayerProgressBar.vue';
import PlayerExtras from '../PlayerExtras.vue';
import PlayerControls from '../PlayerControls.vue';
import PlayerQueue from '../PlayerQueue.vue';
import IconQueueMusic from '@/components/common/Icons/IconQueueMusic.vue';
// import { storePlayer } from '@/stores/modules/player';
// import { storeToRefs } from 'pinia';

const props = defineProps({
  showBackRate: { type: Boolean, default: true },
  showStop: { type: Boolean, default: true },
  showVolume: { type: Boolean, default: true },
  showPlayMode: { type: Boolean, default: true },
});

// 播放列表显示状态
const isPlaylistVisible = ref(false);

// 打开/关闭播放列表
const handleTogglePlaylist = () => {
  isPlaylistVisible.value = !isPlaylistVisible.value;
};

// const player = storePlayer();
</script>

<template>
  <div class="player-standard w-[95vw] h-[95vh] flex flex-col">
    <!-- 上部：大封面背景 -->
    <div class="cover-section flex-1 relative overflow-hidden">
      <!-- 大封面作为背景 -->
      <PlayerCover asBackground :size="200">
        <div class="content-overlay size-full flex flex-col  items-center justify-center p-8">
          <!-- 歌词区域（预留） -->
          <div class="lyrics-area flex-1 flex items-center justify-center text-white text-center">
            <div class="text-gray-300 text-sm">暂无歌词</div>
          </div>

          <!-- 播放控制组件 -->
          <PlayerControls />
        </div>
      </PlayerCover>

      <!-- 从右侧滑出的播放列表 -->
      <Transition name="slide-left">
        <div
          v-show="isPlaylistVisible"
          class="playlist-panel absolute top-0 right-0 h-full w-[420px] flex flex-col pt-10 z-10 will-change-transform"
        >
          <!-- 播放列表内容 -->
          <PlayerQueue />
        </div>
      </Transition>
    </div>

    <!-- 下部：播放条 -->
    <div class="player-bar flex-none p-4 bg-white/15">
      <!-- 歌曲信息和控制按钮 -->
      <div class="flex justify-between items-center mb-4">
        <PlayerInfo :showArtist="true" />
        <PlayerExtras
          :showBackRate="showBackRate"
          :showStop="showStop"
          :showVolume="showVolume"
          :showPlayMode="showPlayMode"
        >
          <!-- 播放列表按钮 -->
          <button
            class="extra-btn bg-transparent"
            @click="handleTogglePlaylist"
            aria-label="播放列表"
            title="播放列表"
          >
            <IconQueueMusic
              class="text-2xl"
              :style="{ color: 'var(--player-color, var(--player-color-default))' }"
            />
          </button>
        </PlayerExtras>
      </div>

      <!-- 进度条 -->
      <div class="w-full">
        <PlayerProgressBar />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-standard {
  min-height: 500px;
}

.cover-section {
  min-width: 0;
}

.lyrics-area {
  overflow-y: auto;
  padding: 20px;
}

/* 自定义主题色时文字保持白色 */
:deep(.player-info) {
  .song-title,
  .song-artist {
    color: white !important;
  }
}

/* 播放列表滑入滑出动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}
</style>
