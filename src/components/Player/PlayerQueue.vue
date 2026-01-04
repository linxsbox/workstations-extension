<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { storePlayer } from '@/stores/modules/player';
import IconQueueMusic from '@/components/common/Icons/IconQueueMusic.vue';

const player = storePlayer();
const { playQueue, currentTime, duration } = storeToRefs(player);

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds || seconds === 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 获取轨道时长（当前播放的使用实时时长）
const getTrackDuration = (track, index) => {
  if (index === playQueue.value.currentIndex) {
    return duration.value || track.duration || 0;
  }
  return track.duration || 0;
};

// 播放指定轨道
const handlePlayTrack = (trackId) => {
  player.playTrackFromQueue(trackId);
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
  <div class="player-queue">
    <div class="queue-header">
      <div class="flex items-center gap-2">
        <IconQueueMusic class="queue-icon" />
        <h3>播放队列 ({{ playQueue.getTrackCount() }})</h3>
      </div>
      <button
        v-if="playQueue.tracks.length > 0"
        @click="player.clearPlaylist()"
        class="clear-btn"
        title="清空队列"
      >
        清空
      </button>
    </div>

    <div v-if="playQueue.tracks.length === 0" class="empty-state">
      队列为空
    </div>

    <div v-else class="queue-list">
      <div
        v-for="(track, index) in playQueue.tracks"
        :key="track.id"
        class="queue-item"
        :class="{ current: isCurrentTrack(index) }"
        @click="handlePlayTrack(track.id)"
      >
        <!-- 左侧：编号/播放图标 -->
        <div class="track-index">
          <span v-if="!isCurrentTrack(index)" class="index-number">{{ index + 1 }}</span>
          <svg v-else class="playing-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
        </div>

        <!-- 中间：歌曲信息 -->
        <div class="track-info">
          <div class="track-title">{{ track.title || '未知歌曲' }}</div>
          <div class="track-artist">{{ track.artist || '未知艺术家' }}</div>
        </div>

        <!-- 右侧：时长和删除按钮 -->
        <div class="track-actions">
          <span class="track-duration">{{ formatTime(getTrackDuration(track, index)) }}</span>
          <button
            class="delete-btn"
            @click="handleRemoveTrack(track.id, $event)"
            title="从队列中删除"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-queue {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #eee;

  .queue-icon {
    width: 18px;
    height: 18px;
    color: #666;
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .clear-btn {
    padding: 4px 12px;
    font-size: 12px;
    color: #666;
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      color: #ff4d4f;
      border-color: #ff4d4f;
      background: #fff1f0;
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  padding: 40px 20px;
}

.queue-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 2px;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;

    .delete-btn {
      opacity: 1;
    }
  }

  &.current {
    background: #f0f4ff;
    border-left: 3px solid var(--player-color, #409eff);

    .track-title {
      color: var(--player-color, #409eff);
      font-weight: 600;
    }

    .playing-icon {
      color: var(--player-color, #409eff);
    }
  }
}

.track-index {
  flex: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  .index-number {
    font-size: 12px;
    color: #999;
    font-weight: 500;
  }

  .playing-icon {
    animation: playing 1s ease-in-out infinite alternate;
  }
}

@keyframes playing {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

.track-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;

  .track-title {
    font-size: 13px;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }

  .track-artist {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.track-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;

  .track-duration {
    font-size: 12px;
    color: #999;
    font-variant-numeric: tabular-nums;
    min-width: 40px;
    text-align: right;
  }

  .delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
    border-radius: 4px;

    &:hover {
      color: #ff4d4f;
      background: #fff1f0;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
}

/* 滚动条样式 */
.queue-list::-webkit-scrollbar {
  width: 6px;
}

.queue-list::-webkit-scrollbar-track {
  background: transparent;
}

.queue-list::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;

  &:hover {
    background: #bbb;
  }
}
</style>
