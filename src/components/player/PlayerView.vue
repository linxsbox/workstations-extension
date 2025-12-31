<script setup>
import { storeToRefs } from "pinia";
import { eventListener, isObject, isValidNumber } from "@linxs/toolkit";
import PlayButton from "./PlayButton/PlayButton.vue";
import { storePlayer } from "@/stores/modules/player";
import { formatPlayTime, PlayerProgressDnD, updateMediaCover } from "./config";

const props = defineProps({
  isBackRate: { type: Boolean, default: true },
});

// Store
const store = storePlayer();
const { getPlayStatus, currentTime, duration, volume, playbackRate } = storeToRefs(store);

// Refs
const playerBox = ref(null);
const playerProgress = ref(null);
const playButton = ref(null);
const progressBarTransition = ref("");
const isJumpProgress = ref(false);
let apDnd = null;

/**
 * 计算播放时长状态
 */
const calcPlayTime = (width = 0) => {
  const percent =
    parseInt(`${(width / playerProgress.value.offsetWidth) * 100}`) / 100;
  const currentTime = parseInt(`${duration.value * percent}`);
  const remainingTime = duration.value - currentTime;
  return { currentTime, remainingTime };
};

/** 获取当前进度条元素 */
const getCurrentProgressBar = () => {
  return playerProgress.value.querySelector(".progress-bar");
};

/** 设置进度条过渡宽度 */
const setProgressBarTransitionWidth = (width = 0) => {
  progressBarTransition.value = `width:${width}px`;
};

/**
 * 设置当前状态下的进度条宽度
 */
const setCurrentStateProgressWidth = (width = 0, remainingTime, event = "") => {
  const style = [
    `width:${
      isValidNumber(width)
        ? width
        : getIsPlaying.value
        ? (playerProgress.value || {}).offsetWidth || 0
        : getCurrentProgressBar().offsetWidth
    }px`,
  ];

  nextTick(() => {
    if (getIsPlaying.value) {
      const time =
        remainingTime === null
          ? currentTime.value || duration.value
          : remainingTime;
      style.push(`transition: width ${time / playbackRate.value}s linear`);
    }
    progressBarTransition.value = style.join(";");
  });
};

onMounted(() => {
  // 初始化音频管理器
  store.initAudioManager();

  // 初始化进度条拖拽
  apDnd = new PlayerProgressDnD(
    playerBox.value,
    playerProgress.value,
    getCurrentProgressBar()
  );
  apDnd.disabled = true;

  let lastRemainingTime = 0;
  apDnd.on("mousemove", ({ width }) => {
    setProgressBarTransitionWidth(width);
    const { currentTime: ct, remainingTime } = calcPlayTime(width);
    lastRemainingTime = remainingTime;
  });

  apDnd.on("mouseup", ({ width }) => {
    if (apDnd.isDnD) return;
    setCurrentStateProgressWidth(width, lastRemainingTime, "mouseup trigger");
    store.seek(calcPlayTime(width).currentTime);
  });

  apDnd.on("mouseleave", ({ width }) => {
    if (apDnd.isDnD) return;
    setCurrentStateProgressWidth(
      width,
      lastRemainingTime,
      "mouseleave trigger"
    );
    store.seek(calcPlayTime(width).currentTime);
  });
});

onBeforeUnmount(() => {
  // 清理会在这里处理
});

// 切换播放速率
const handleChangePlaybackRate = () => {
  const newRate = playbackRate.value === 1 ? 2 : 1;
  store.setPlaybackRate(newRate);
};

// 进度条拖动
const handleProgressDnD = (e) => {
  apDnd.handleDnD(e);
};

// 点击进度条跳转
const handleJumpProgress = (event) => {
  if (apDnd.isDnD || !getIsPlayerEnable.value) return;
  event.stopPropagation();
  isJumpProgress.value = true;

  const { currentTime: ct, remainingTime } = calcPlayTime(event.offsetX);

  setProgressBarTransitionWidth(event.offsetX);

  nextTick(() => {
    getIsPlaying.value &&
      setCurrentStateProgressWidth(null, remainingTime, "jump trigger");
    store.seek(ct);
    isJumpProgress.value = false;
  });
};

// 切换播放状态
const handleChangePlayState = (isPlayState) => {
  if (apDnd.disabled || !getIsPlayerEnable.value) return;
  if (isPlayState) {
    store.play();
  } else {
    store.pause();
  }
};

const handleUpdateVolume = (value) => {
  store.setVolume(value / 100);
};

/** 获取是否播放状态 */
const getIsPlaying = computed(() => {
  return getPlayStatus.value.isPlaying;
});

/** 是否可启用播放器 */
const getIsPlayerEnable = computed(() => {
  return getPlayStatus.value.src && !getPlayStatus.value.isError;
});

/** 当前播放标题 */
const currentPlayTitle = computed(() => {
  return getPlayStatus.value.title || "";
});

/** 当前时间格式化 */
const currentTimeFormatted = computed(() => {
  return formatPlayTime(currentTime.value);
});

/** 总时间格式化 */
const totalTimeFormatted = computed(() => {
  return formatPlayTime(duration.value);
});

/** 进度条宽度百分比 */
const progressPercent = computed(() => {
  return duration.value ? (currentTime.value / duration.value) * 100 : 0;
});

/** 监听播放状态变化，更新进度条 */
watch(
  () => getPlayStatus.value.isPlaying,
  (newVal) => {
    setCurrentStateProgressWidth(null, null, "play state changed");
    apDnd.disabled = !getIsPlayerEnable.value;
  }
);

/** 监听播放源变化，更新封面等 */
watch(
  () => getPlayStatus.value.src,
  (newSrc) => {
    if (newSrc) {
      setProgressBarTransitionWidth(0);

      const album = getPlayStatus.value.album;
      const isAlbumInfo = album && isObject(album);
      if (isAlbumInfo) {
        if (album.image) {
          updateMediaCover(album, getPlayStatus.value.title);
        }
        if (isObject(album.theme) && album.theme.color) {
          setThemeStyle(album.theme);
        }
      }
    }
  }
);

const themeStyle = ref({});
const setThemeStyle = (theme) => {
  themeStyle.value = {
    "--player-color": theme.color,
    "--play-button-bg-color": theme.rgb,
    "--player-progress-slider": `rgba(${theme.rgb}, 0.6)`,
  };
};
</script>

<template>
  <div ref="playerBox" class="player-box select-none" :style="themeStyle">
    <div class="player-control-bar">
      <div class="player-play-bar">
        <PlayButton
          ref="playButton"
          class="play-button"
          @play="handleChangePlayState(true)"
          @pause="handleChangePlayState(false)"
          :isPlay="getIsPlaying"
          :isDisabled="!getIsPlayerEnable"
        />
      </div>

      <div class="player-status-bar">
        <div
          class="palyer-back-rate"
          @click="handleChangePlaybackRate"
          v-if="isBackRate"
        >
          {{ playbackRate === 1 ? "1.x" : "2.x" }}
        </div>
        <div>
          <NPopover placement="bottom" trigger="click">
            <template #trigger>
              <n-button>音量</n-button>
            </template>
            <NSlider
              :value="volume * 100"
              :on-update:value="handleUpdateVolume"
              vertical
            />
          </NPopover>
        </div>
      </div>

      <div class="player-play-info select-text">
        <slot name="info">{{ currentPlayTitle }}</slot>
      </div>
    </div>

    <div class="player-progress-bar">
      <div class="current-time text-left">
        {{ currentTimeFormatted || "00:00" }}
      </div>
      <div
        ref="playerProgress"
        class="player-progress"
        @click.self="handleJumpProgress"
      >
        <div class="progress-bar" :style="progressBarTransition">
          <div class="progress-slider" @mousedown="handleProgressDnD"></div>
        </div>
      </div>
      <div class="total-time text-right">
        {{ totalTimeFormatted || "00:00" }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-box {
  --player-color-default: #409eff;
  --play-button-bg-color-default: 64, 158, 255;
  --player-bg-default: #fff;
  --player-border-defult: none;
  --player-border-radius-defult: none;
  --player-progress-slider-default: rgba(0, 145, 255, 0.6);
  --player-progress-slider-bg-default: #fff;
  --player-progress-slider-bar-default: rgba(216, 216, 216, 0.7);

  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background-color: var(--player-bg);
  border: var(--player-border, var(--player-border-defult));
  border-radius: var(
    --player-border-radius,
    var(--player-border-radius-defult)
  );

  .player-control-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    flex: none;
  }

  .player-play-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    flex: none;

    .play-button {
      font-size: 36px;
      color: var(--player-color, var(--player-color-default));
    }
  }

  .player-status-bar {
    display: flex;
    flex: 1 1 0%;

    .palyer-back-rate {
      width: 24px;
      height: 24px;
      padding: 4px;
      font-size: 12px;
      line-height: 16px;
      color: var(--player-color, var(--player-color-default));
      background-color: rgba(
        var(--play-button-bg-color, var(--play-button-bg-color-default)),
        0.1
      );
      border-radius: 999px;
      cursor: pointer;
    }
  }

  .player-progress-bar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    .current-time,
    .total-time {
      flex: none;
      min-width: 60px;
      font-size: 12px;
    }
  }

  .player-progress {
    position: relative;
    flex: 1 1 0%;
    width: 100%;
    height: 8px;
    background-color: var(
      --player-progress-slider-bar,
      var(--player-progress-slider-bar-default)
    );
    border-radius: 999px;
    will-change: auto;

    .progress-bar {
      width: 0px;
      height: inherit;
      background-color: var(
        --player-progress-slider,
        var(--player-progress-slider-default)
      );
      border-radius: inherit;
      transform: translateZ(0);
      pointer-events: none;
    }

    .progress-slider {
      position: absolute;
      top: -4px;
      right: -8px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 16px;
      height: 16px;
      background-color: var(
        --player-progress-slider-bg,
        var(--player-progress-slider-bg-default)
      );
      border-radius: inherit;
      box-shadow: 0 0 3px 0 rgb(0, 0, 0, 0.35);
      pointer-events: auto;

      &:after {
        content: "";
        flex: none;
        width: 8px;
        height: 8px;
        background-color: var(
          --player-progress-slider,
          var(--player-progress-slider-default)
        );
        border-radius: inherit;
        box-shadow: 0 1px 1px 0 rgb(0, 0, 0, 0.35);
      }
    }
  }

  .player-play-info {
    font-size: 12px;
    line-height: 16px;
  }
}
</style>
