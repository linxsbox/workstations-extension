<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { NPopconfirm, NScrollbar } from "naive-ui";
import { sec2time } from "@/utils/time";
import { storePlayer } from "@/stores/modules/player";
import IconQueueMusic from "@/components/common/Icons/IconQueueMusic.vue";
import IconPlaylistRemove from "@/components/common/Icons/IconPlaylistRemove.vue";
import IconDelete from "@/components/common/Icons/IconDelete.vue";

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
  console.log("[PlayerQueue] 双击播放 hash:", trackId, index);

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
  <div class="player-queue flex flex-col h-full rounded-xl backdrop-blur-sm">
    <div
      class="queue-header flex justify-between items-center px-4 py-3 border-b"
    >
      <div class="flex items-center gap-2">
        <IconQueueMusic
          class="text-xl flex-shrink-0"
          :style="{ color: 'var(--text-secondary)' }"
        />
        <h3
          class="m-0 text-sm font-semibold"
          :style="{ color: 'var(--text-primary)' }"
        >
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
            class="clear-btn flex items-center justify-center size-7 bg-transparent rounded-md cursor-pointer text-[var(--color-red)] hover:bg-[var(--player-close-hover-bg)]"
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
      class="flex-1 flex items-center justify-center text-sm py-10 px-5"
      :style="{ color: 'var(--text-secondary)' }"
    >
      播放列表为空
    </div>

    <NScrollbar v-else class="flex-1" content-class="p-2">
      <div
        v-for="(track, index) in playQueue.tracks"
        :key="track.id"
        class="queue-item flex items-center gap-3 px-4 py-2.5 mb-1 rounded-lg cursor-pointer transition-all duration-200 select-none"
        :class="{ current: isCurrentTrack(index) }"
        :style="{
          '--queue-item-theme-color':
            track.album?.theme?.color || 'transparent',
        }"
        @dblclick="handlePlayTrack(track.id, index)"
      >
        <!-- 歌曲信息 -->
        <div class="flex-1 min-w-0 overflow-hidden">
          <div
            class="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis mb-1"
            :style="{ color: 'var(--text-primary)' }"
          >
            {{ track.title || "未知歌曲" }}
          </div>
          <div
            class="text-[11px] whitespace-nowrap overflow-hidden text-ellipsis"
            :style="{ color: 'var(--text-secondary)' }"
          >
            {{ track.artist || "未知艺术家" }}
          </div>
        </div>

        <!-- 右侧：时长和删除按钮 -->
        <div class="flex-none flex items-center gap-2">
          <span
            class="text-xs tabular-nums min-w-[40px] text-right"
            :style="{ color: 'var(--text-secondary)' }"
          >
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
  background-color: var(--player-queue-bg);
  border: 1px solid var(--player-queue-panel-border);

  .queue-header {
    border-color: var(--player-queue-header-border);
  }
}

.queue-item {
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: var(--queue-item-theme-color, transparent);
    border-radius: 4px 0 0 4px;
  }

  &:hover {
    background-color: var(--state-hover);

    .delete-btn {
      opacity: 1;
      color: var(--color-error);
    }
  }
}
</style>
