<script setup>
import PlayerInfo from "../PlayerInfo.vue";
import PlayerControls from "../PlayerControls.vue";
import PlayerExtras from "../PlayerExtras.vue";
import PlayerProgressBar from "../PlayerProgressBar.vue";
import PlayerQueue from "../PlayerQueue.vue";

const props = defineProps({
  showBackRate: { type: Boolean, default: true },
  showStop: { type: Boolean, default: true },
  showVolume: { type: Boolean, default: true },
  showPlayMode: { type: Boolean, default: true },
});
</script>

<template>
  <div class="player-list w-[360px] min-h-[400px] max-h-[80vh] flex flex-col gap-4">
    <!-- 上部：封面、歌曲信息、播放控制 -->
    <div class="flex flex-col items-center gap-3 px-4 pt-10">
      <!-- 歌曲信息 + 播放控制 -->
      <div class="w-full flex flex-col items-center gap-3">
        <!-- 歌曲信息 -->
        <PlayerInfo />

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
    <PlayerProgressBar class="px-3" />

    <!-- 播放列表 -->
    <div class="queue-container flex flex-col flex-1 px-2.5 pb-3">
      <PlayerQueue class="h-full flex-1" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-list {
  background-color: var(--player-bg-default);
  box-shadow: var(--player-card-shadow);
}

.queue-container {
}
</style>
