<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { storePlayer } from '@/stores/modules/player';
import PlayButton from './PlayButton.vue';
import IconSkipPrevious from '@/components/common/Icons/IconSkipPrevious.vue';
import IconSkipNext from '@/components/common/Icons/IconSkipNext.vue';

// Store
const player = storePlayer();
const { getPlayStatus } = storeToRefs(player);

/** 获取是否播放状态 */
const getIsPlaying = computed(() => {
  return getPlayStatus.value.isPlaying;
});

/** 是否可启用播放器 */
const getIsPlayerEnable = computed(() => {
  return getPlayStatus.value.src && !getPlayStatus.value.isError;
});

// 播放/暂停
const handleChangePlayState = (isPlayState) => {
  console.log('[PlayerControls] handleChangePlayState 被调用, isPlayState:', isPlayState, 'isPlayerEnable:', getIsPlayerEnable.value);

  if (!getIsPlayerEnable.value) {
    console.warn('[PlayerControls] 播放器未启用，无法操作');
    return;
  }

  if (isPlayState) {
    console.log('[PlayerControls] 调用 player.play()');
    player.play();
  } else {
    console.log('[PlayerControls] 调用 player.pause()');
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
      class="control-btn"
      :disabled="!getIsPlayerEnable"
      @click="handlePrevious"
      aria-label="上一曲"
    >
      <IconSkipPrevious class="control-icon" />
    </button>

    <PlayButton
      class="play-button text-4xl"
      style="color: var(--player-color, var(--player-color-default));"
      @play="handleChangePlayState(true)"
      @pause="handleChangePlayState(false)"
      :isPlay="getIsPlaying"
      :isDisabled="!getIsPlayerEnable"
    />

    <button
      class="control-btn"
      :disabled="!getIsPlayerEnable"
      @click="handleNext"
      aria-label="下一曲"
    >
      <IconSkipNext class="control-icon" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.player-controls {
  .control-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    color: var(--player-color, var(--player-color-default));
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;

    &:hover:not(:disabled) {
      opacity: 1;
      transform: scale(1.1);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .control-icon {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
