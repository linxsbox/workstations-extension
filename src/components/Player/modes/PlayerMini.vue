<script setup>
import PlayerCover from '../PlayerCover.vue';
import PlayerInfo from '../PlayerInfo.vue';
import PlayerControls from '../PlayerControls.vue';

const props = defineProps({
  showPlayMode: { type: Boolean, default: false },
  showVolume: { type: Boolean, default: false },
});
</script>

<template>
  <div class="player-mini flex items-center gap-4 p-4">
    <!-- 封面 -->
    <PlayerCover :size="48" />

    <!-- 歌曲信息和播放控制 -->
    <div class="flex-1 flex flex-col gap-2 min-w-0">
      <!-- 歌曲信息 -->
      <PlayerInfo align="left" :showArtist="true" />

      <!-- 播放控制器 -->
      <PlayerControls />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-mini {
  background-color: var(--player-bg-default);
  border-radius: 8px;
  box-shadow: var(--player-card-shadow);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: var(--player-card-shadow-hover);
  }
}
</style>
