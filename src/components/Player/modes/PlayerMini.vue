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
  <div class="player-mini flex items-center gap-4 p-4 bg-white rounded-lg">
    <!-- 封面 -->
    <PlayerCover size="small" />

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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
