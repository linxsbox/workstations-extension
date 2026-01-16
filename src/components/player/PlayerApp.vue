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
      class="app-icon"
      :class="{ active: getIsPlayerVisible || isPlaying }"
      @click="handleOpenPlayer"
      title="打开播放器"
    >
      <IconMusicNote class="text-2xl" />
      <!-- 播放状态指示器 -->
      <div v-if="isPlaying" class="indicator"></div>
    </button>
    <!-- APP标签 -->
    <div class="app-label">播放器</div>
  </div>
</template>

<style lang="scss" scoped>
.player-app {
  .app-icon {
    &.active {
      background-color: rgba(var(--play-button-bg-color, 64, 158, 255), 0.15);
      border-color: var(--player-color-default, #409eff);
      box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
    }

    // 播放状态指示器
    .indicator {
      @apply absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full;
      background-color: var(--player-color-default, #409eff);
      border: 2px solid var(--bg-primary);
      animation: pulse 2s infinite;
    }
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
