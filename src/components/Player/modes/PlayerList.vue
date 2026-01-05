<script setup>
import PlayerCover from '../PlayerCover.vue';
import PlayerInfo from '../PlayerInfo.vue';
import PlayerControls from '../PlayerControls.vue';
import PlayerExtras from '../PlayerExtras.vue';
import PlayerProgressBar from '../PlayerProgressBar.vue';
import PlayerQueue from '../PlayerQueue.vue';

const props = defineProps({
  showBackRate: { type: Boolean, default: true },
  showStop: { type: Boolean, default: true },
  showVolume: { type: Boolean, default: true },
  showPlayMode: { type: Boolean, default: true },
});
</script>

<template>
  <div class="player-list flex flex-col gap-4 p-4 bg-white rounded-lg">
    <!-- 上部：封面、歌曲信息、播放控制 -->
    <div class="flex flex-col items-center gap-3">
      <!-- 封面 -->
      <PlayerCover :size="64" />

      <!-- 歌曲信息 + 播放控制 -->
      <div class="w-full flex flex-col items-center gap-3">
        <!-- 歌曲信息 -->
        <PlayerInfo align="center" :showArtist="true" />

        <!-- 播放控制器 -->
        <div class="flex items-center gap-4">
          <PlayerControls />
          <PlayerExtras
            :showBackRate="showBackRate"
            :showStop="showStop"
            :showVolume="showVolume"
            :showPlayMode="showPlayMode"
          />
        </div>
      </div>
    </div>

    <!-- 播放进度条 -->
    <PlayerProgressBar />

    <!-- 播放列表 -->
    <div class="queue-container">
      <PlayerQueue />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-list {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.queue-container {
  flex: 1;
  min-height: 200px;
  overflow: hidden;
}
</style>
