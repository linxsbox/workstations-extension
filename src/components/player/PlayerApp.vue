<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { storePlayer } from "@/stores/modules/player";
import IconMusicNote from "@/components/common/Icons/IconMusicNote.vue";

const player = storePlayer();
const { getPlayStatus, getIsPlayerVisible } = storeToRefs(player);

// 是否正在播放
const isPlaying = computed(() => {
  return getPlayStatus.value.isPlaying;
});

// 打开播放器
const handleOpenPlayer = () => {
  player.showPlayer();
};
</script>

<template>
  <div class="player-app flex flex-col items-center gap-1">
    <!-- 播放器APP图标 -->
    <button
      class="app-icon flex items-center justify-center rounded-lg transition-all"
      :class="{ active: getIsPlayerVisible || isPlaying }"
      @click="handleOpenPlayer"
      title="打开播放器"
    >
      <IconMusicNote class="text-2xl" />
      <!-- 播放状态指示器 -->
      <div v-if="isPlaying" class="indicator"></div>
    </button>
    <!-- APP标签 -->
    <div class="label text-xs font-medium text-center">播放器</div>
  </div>
</template>

<style lang="scss" scoped>
.player-app {
  .app-icon {
    width: 48px;
    height: 48px;
    position: relative;
    background-color: var(--state-hover);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    cursor: pointer;

    &:hover {
      background-color: var(--interactive-bg-hover);
      transform: scale(1.05);
    }

    &.active {
      background-color: rgba(var(--play-button-bg-color, 64, 158, 255), 0.15);
      border-color: var(--player-color-default, #409eff);
      box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
    }

    // 播放状态指示器
    .indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      background-color: var(--player-color-default, #409eff);
      border: 2px solid var(--bg-primary);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
  }

  .label {
    color: var(--text-secondary);
    max-width: 60px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
