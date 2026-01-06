<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { NPopconfirm, NScrollbar } from 'naive-ui';
import { sec2time } from '@/utils/time';
import { storePlayer } from '@/stores/modules/player';
import IconQueueMusic from '@/components/common/Icons/IconQueueMusic.vue';
import IconPlaylistRemove from '@/components/common/Icons/IconPlaylistRemove.vue';

const player = storePlayer();
const { playQueue, currentTime, duration } = storeToRefs(player);

// 获取轨道时长（当前播放的使用实时时长）
const getTrackDuration = (track, index) => {
  if (index === playQueue.value.currentIndex) {
    return duration.value || track.duration || 0;
  }
  return track.duration || 0;
};

// 播放指定轨道
const handlePlayTrack = (trackId, index) => {
  console.log('[PlayerQueue] 双击播放 hash:', trackId, index);

  // 如果是当前播放的轨道
  if (isCurrentTrack(index)) {
    // 检查是否已加载音频
    if (player.getPlayStatus.src) {
      // 已加载，切换播放状态
      player.togglePlay();
    } else {
      // 未加载，重新播放
      player.playByHash(trackId);
    }
    return;
  }

  player.playByHash(trackId);
};

// 删除轨道
const handleRemoveTrack = (trackId, event) => {
  event.stopPropagation();
  player.removeFromQueue(trackId);
};

// 判断是否是当前播放的轨道
const isCurrentTrack = (index) => {
  return index === playQueue.value.currentIndex;
};
</script>

<template>
  <div class="player-queue flex flex-col h-full bg-white/50 rounded-lg overflow-hidden backdrop-blur-sm">
    <div class="queue-header flex justify-between items-center px-4 py-3 bg-white/50 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <IconQueueMusic class="text-xl text-gray-600 flex-shrink-0" />
        <h3 class="m-0 text-sm font-semibold text-gray-800">播放列表 ({{ playQueue.getTrackCount() }})</h3>
      </div>
      <NPopconfirm
        v-if="playQueue.tracks.length > 0"
        @positive-click="player.clearPlaylist()"
        positive-text="确认"
        negative-text="取消"
      >
        <template #trigger>
          <button
            class="clear-btn flex items-center justify-center size-7 text-gray-600 bg-transparent rounded cursor-pointer transition-all hover:text-red-500"
            title="清空列表"
          >
            <IconPlaylistRemove class="text-lg" />
          </button>
        </template>
        确定要清空播放列表吗？
      </NPopconfirm>
    </div>

    <div v-if="playQueue.tracks.length === 0" class="flex-1 flex items-center justify-center text-black/75 text-sm py-10 px-5">
      播放列表为空
    </div>

    <NScrollbar v-else class="flex-1" content-class="p-1">
      <div
        v-for="(track, index) in playQueue.tracks"
        :key="track.id"
        class="queue-item flex items-center gap-3 px-3 py-2 mb-0.5 bg-white/75 rounded-md cursor-pointer transition-all duration-200 select-none"
        :class="{ current: isCurrentTrack(index) }"
        @dblclick="handlePlayTrack(track.id, index)"
      >
        <!-- 歌曲信息 -->
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="text-[13px] font-medium text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis mb-0.5">
            {{ track.title || '未知歌曲' }}
          </div>
          <div class="text-[11px] text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
            {{ track.artist || '未知艺术家' }}
          </div>
        </div>

        <!-- 右侧：时长和删除按钮 -->
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs text-gray-400 tabular-nums min-w-[40px] text-right">
            {{ sec2time(getTrackDuration(track, index)) }}
          </span>
          <button
            class="delete-btn flex items-center justify-center w-6 h-6 p-0 bg-transparent border-none text-gray-400 cursor-pointer opacity-0 transition-all rounded hover:text-red-500 hover:bg-red-50"
            @click="handleRemoveTrack(track.id, $event)"
            title="从列表中删除"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<style lang="scss" scoped>
@keyframes currentTrackGradient {
  0%, 100% {
    background: rgba(240, 244, 255, 0.6);
  }
  50% {
    background: rgba(224, 235, 255, 0.9);
  }
}

.queue-item {
  &:hover {
    background: #f5f5f5;

    .delete-btn {
      opacity: 1;
      color: #ef4444;
    }
  }

  &.current {
    animation: currentTrackGradient 3s ease-in-out infinite;

    .text-gray-800 {
      color: var(--player-color, #409eff) !important;
      font-weight: 600;
    }

    .text-gray-400 {
      color: var(--player-color, #409eff) !important;
      font-weight: 600;
    }
  }
}
</style>
