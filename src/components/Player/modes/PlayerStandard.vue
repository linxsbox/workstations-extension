<script setup>
// import { storePlayer } from '@/stores/modules/player';
import PlayerCover from '../PlayerCover.vue';
import PlayerInfo from '../PlayerInfo.vue';
import PlayerProgressBar from '../PlayerProgressBar.vue';
// import { storeToRefs } from 'pinia';
// import { ref, watch } from 'vue';
// import PlayerControls from '../PlayerControls.vue';
// import PlayerExtras from '../PlayerExtras.vue';
// import PlayerQueue from '../PlayerQueue.vue';
// import IconQueueMusic from '@/components/common/Icons/IconQueueMusic.vue';

// const props = defineProps({
//   showBackRate: { type: Boolean, default: true },
//   showStop: { type: Boolean, default: true },
//   showVolume: { type: Boolean, default: true },
//   showPlayMode: { type: Boolean, default: true },
// });

// const player = storePlayer();
</script>

<template>
  <div class="player-standard w-[95vw] h-[95vh] flex flex-col bg-white/15 backdrop-blur-sm">
    <!-- 上部：大封面背景 -->
    <div class="cover-section flex-1 relative">
      <!-- 大封面作为背景 -->
      <PlayerCover asBackground size="large">
        <div class="content-overlay flex flex-col h-full items-center justify-center p-8">
          <!-- 歌词区域（预留） -->
          <div class="lyrics-area flex-1 flex items-center justify-center text-white text-center">
            <div class="text-gray-300 text-sm">暂无歌词</div>
          </div>
        </div>
      </PlayerCover>
    </div>

    <!-- 下部：播放条 -->
    <div class="player-bar flex-none p-4">
      <!-- 歌曲信息 -->
      <div class="mb-2">
        <PlayerInfo align="center" :showArtist="true" />
      </div>

      <!-- 进度条 -->
      <div class="w-full">
        <PlayerProgressBar />
      </div>
    </div>

    <!-- 播放列表（暂时注释） -->
    <!-- <div class="right-panel flex flex-col bg-white transition-all duration-300" :class="{ collapsed: !isQueueExpanded }">
      <div class="queue-controls flex items-center justify-between p-3 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <IconQueueMusic class="queue-icon" />
          <h3 class="text-sm font-semibold text-gray-700">播放列表</h3>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="control-btn"
            :class="{ active: isQueuePinned }"
            @click="toggleQueuePinned"
            :title="isQueuePinned ? '取消固定' : '固定列表'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" fill="currentColor"/>
            </svg>
          </button>
          <button
            class="control-btn"
            @click="toggleQueue"
            :title="isQueueExpanded ? '收起列表' : '展开列表'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path v-if="isQueueExpanded" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              <path v-else d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-show="isQueueExpanded" class="queue-content flex-1 overflow-hidden">
        <PlayerQueue />
      </div>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
.player-standard {
  min-height: 500px;
}

.cover-section {
  min-width: 0;
}

.content-overlay {
  width: 100%;
  height: 100%;
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
</style>
