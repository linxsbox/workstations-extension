<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { storePlayer } from '@/stores/global/player';
import PlayButton from './PlayButton.vue';
import IconSkipPrevious from '@/components/common/Icons/IconSkipPrevious.vue';
import IconSkipNext from '@/components/common/Icons/IconSkipNext.vue';

const props = defineProps({
  // 播放按钮尺寸（像素）
  playButtonSize: {
    type: Number,
    default: 48
  },
  // 上一曲/下一曲按钮尺寸（像素）
  skipButtonSize: {
    type: Number,
    default: 32
  }
});

// Store
const player = storePlayer();
const { getPlayStatus, getPlayQueue } = storeToRefs(player);

/** 获取是否播放状态 */
const getIsPlaying = computed(() => {
  return getPlayStatus.value.isPlaying;
});

/** 是否可启用播放器 */
const getIsPlayerEnable = computed(() => {
  return getPlayStatus.value.src && !getPlayStatus.value.isError;
});

/** 是否可以上一曲/下一曲（队列必须有多于1个音源） */
const getCanSkip = computed(() => {
  return getPlayQueue.value.getTrackCount() > 1;
});

// 播放/暂停
const handleChangePlayState = (isPlayState) => {
  if (!getIsPlayerEnable.value) {
    return;
  }

  if (isPlayState) {
    player.play();
  } else {
    player.pause();
  }
};

// 上一曲
const handlePrevious = () => {
  if (!getIsPlayerEnable.value) return;
  player.playPrevious();
};

// 下一曲
const handleNext = () => {
  if (!getIsPlayerEnable.value) return;
  player.playNext();
};
</script>

<template>
  <div class="player-controls flex justify-center items-center gap-2">
    <button
      :class="[
        'control-btn flex items-center justify-center p-2 bg-transparent border-none cursor-pointer transition-all duration-200 opacity-70',
        'hover:opacity-100 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed',
        'text-[var(--player-color,var(--player-color-default))]'
      ]"
      :disabled="!getIsPlayerEnable || !getCanSkip"
      @click="handlePrevious"
      aria-label="上一曲"
      title="上一曲"
    >
      <IconSkipPrevious :style="{ fontSize: `${skipButtonSize}px` }" />
    </button>

    <PlayButton
      class="text-[var(--player-color,var(--player-color-default))]"
      :style="{ fontSize: `${playButtonSize}px`}"
      @play="handleChangePlayState(true)"
      @pause="handleChangePlayState(false)"
      :isPlay="getIsPlaying"
      :isDisabled="!getIsPlayerEnable"
    />

    <button
      :class="[
        'control-btn flex items-center justify-center p-2 bg-transparent border-none cursor-pointer transition-all duration-200 opacity-70',
        'hover:opacity-100 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed',
        'text-[var(--player-color,var(--player-color-default))]'
      ]"
      :disabled="!getIsPlayerEnable || !getCanSkip"
      @click="handleNext"
      aria-label="下一曲"
      title="下一曲"
    >
      <IconSkipNext :style="{ fontSize: `${skipButtonSize}px` }" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
</style>
