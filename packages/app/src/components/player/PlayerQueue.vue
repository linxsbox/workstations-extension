<script setup>
import { storeToRefs } from 'pinia';
import { NPopconfirm, NScrollbar } from 'naive-ui';
import { sec2time } from '@/utils/time';
import { storePlayer } from '@/stores/global/player';
import IconQueueMusic from '@/components/common/Icons/IconQueueMusic.vue';
import IconPlaylistRemove from '@/components/common/Icons/IconPlaylistRemove.vue';
import IconDelete from '@/components/common/Icons/IconDelete.vue';

const player = storePlayer();
const { playQueue, duration } = storeToRefs(player);

// 获取轨道时长（当前播放的使用实时时长）
const getTrackDuration = (track, index) => {
  if (index === playQueue.value.currentIndex) {
    return duration.value || track.duration || 0;
  }
  return track.duration || 0;
};

// 判断是否是当前播放的轨道
const isCurrentTrack = (trackId) => {
  const currentTrack = playQueue.value.getCurrentTrack();
  return currentTrack?.id === trackId;
};

// 播放指定轨道
const handlePlayTrack = (trackId) => {
  // 如果是当前播放的轨道
  if (isCurrentTrack(trackId)) {
    const currentTrack = playQueue.value.getCurrentTrack();
    // 检查是否已加载音频，且加载的是正确的音频源
    if (
      player.getPlayStatus.src &&
      player.getPlayStatus.src === currentTrack?.src
    ) {
      // 已加载正确的音频，切换播放状态
      player.togglePlay();
    } else {
      // 未加载或加载的是错误的音频，重新播放
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

// 获取轨道的主题样式
const getTrackStyle = (track) => {
  const { color, rgb } = track.album?.theme || {};
  return {
    ...(color && { '--album-theme-color': color }),
    ...(rgb && { '--album-theme-rgb': rgb }),
  };
};
</script>

<template>
  <div class="player-queue flex flex-col h-full rounded-xl backdrop-blur-md">
    <div
      class="queue-header flex justify-between items-center px-4 py-3 border-b rounded-t-xl"
    >
      <div class="flex items-center gap-2">
        <IconQueueMusic class="text-xl flex-shrink-0 text-[var(--text-secondary)]" />
        <h3 class="m-0 text-sm font-semibold text-[var(--text-primary)]">
          播放列表 ({{ playQueue.getTrackCount() }})
        </h3>
      </div>
      <NPopconfirm
        v-if="playQueue.tracks.length > 0"
        @positive-click="player.clearPlaylist()"
        positive-text="确认"
        negative-text="取消"
      >
        <template #trigger>
          <button
            class="clear-btn flex items-center justify-center size-7 bg-transparent rounded-md cursor-pointer"
            title="清空列表"
          >
            <IconPlaylistRemove class="text-xl" />
          </button>
        </template>
        确定要清空播放列表吗？
      </NPopconfirm>
    </div>

    <div
      v-if="playQueue.tracks.length === 0"
      class="flex-1 flex items-center justify-center text-sm py-10 px-5 rounded-b-xl text-[var(--text-secondary)] bg-[var(--player-queue-list-bg)]"
    >
      播放列表为空
    </div>

    <NScrollbar v-else class="queue-list flex-1 rounded-b-xl" content-class="p-2">
      <div
        v-for="(track, index) in playQueue.tracks"
        :key="track.id"
        class="queue-item flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg cursor-pointer select-none"
        :class="{ current: isCurrentTrack(track.id) }"
        :style="getTrackStyle(track)"
        @dblclick="handlePlayTrack(track.id)"
      >
        <!-- 歌曲信息 -->
        <div class="flex-1 min-w-0 overflow-hidden">
          <div class="album-title text-[13px] font-medium truncate mb-1">
            {{ track.title || '未知歌曲' }}
          </div>
          <div class="album-artist text-[11px] truncate">
            {{ track.artist || '未知艺术家' }}
          </div>
        </div>

        <!-- 右侧：时长和删除按钮 -->
        <div class="flex-none flex items-center gap-2">
          <span class="text-xs tabular-nums min-w-[40px] text-right text-[var(--text-secondary)]">
            {{ sec2time(getTrackDuration(track, index)) }}
          </span>
          <button
            class="delete-btn flex items-center justify-center size-6 p-0 bg-transparent border-none cursor-pointer opacity-0"
            @click="handleRemoveTrack(track.id, $event)"
            title="从列表中删除"
          >
            <IconDelete />
          </button>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<style lang="scss" scoped>
.player-queue {
  border: 1px solid var(--player-queue-panel-border);

  .queue-header {
    background-color: var(--player-queue-header-bg);
    border-color: var(--player-queue-header-border);

    .clear-btn {
      color: var(--color-red);

      &:hover {
        background-color: rgba(var(--color-red-rgb), 0.12);
      }
    }
  }

  :deep(.queue-list) {
    background-color: var(--player-queue-list-bg);
  }
}

.queue-item {
  position: relative;
  background-color: rgba(
    var(--album-theme-rgb, var(--play-button-bg-color-default)),
    0.05
  );
  border-left: 3px solid;
  border-color: transparent;
  transition: background-color 0.2s;

  &.current {
    border-color: var(--album-theme-color, var(--player-color-default));
  }

  &:hover {
    background-color: rgba(
      var(--album-theme-rgb, var(--play-button-bg-color-default)),
      0.15
    );

    .delete-btn {
      opacity: 1;
      color: var(--color-red);
    }
  }

  .album-title {
    color: var(--album-theme-color, --player-color-default);
  }

  .album-artist {
    color: rgba(var(--album-theme-rgb, --play-button-bg-color-default), 0.7);
  }
}
</style>
