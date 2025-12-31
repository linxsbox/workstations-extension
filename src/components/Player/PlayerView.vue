<script setup>
import { eventListener, isObject, isValidNumber } from "@linxs/toolkit";
import PlayButton from "../PlayButton/PlayButton.vue";
import { storePlayer } from "@/stores/storePlayer";
import { formatPlayTime, PlayerProgressDnD, updateMediaCover } from "./config";

const props = defineProps({
  isBackRate: { type: Boolean, default: true },
});

// Store
const store = storePlayer();
const { getPlayStatus } = storeToRefs(store);

// Refs 元素
const audio = ref(null); // 音频
const playerBox = ref(null); // 播放器
const playerProgress = ref(null); // 进度条
const playButton = ref(null); // 播放按钮
const audioSrc = ref(null); // 音频线媒体源
/** 音量 */
const volume = ref(1);
/** 是否静音 */
const isMuted = ref(false);
/** 播放倍速 */
const backRate = ref(1);
/** 进度条过渡效果 */
const progressBarTransition = ref("");
/** 是否切换了音频源 */
const isSwitchAudioSrc = ref(false);
/** 当前播放时间 */
const currentPlayTime = ref(0);
/** 总播放时间 */
const totalPlayTime = ref(0);
const currentTimeFormatted = ref("00:00");
const totalTimeFormatted = ref("00:00");
const isJumpProgress = ref(false);
let apDnd = null;

/**
 * 计算播放时长状态
 * @param width 进度条当前宽度 - 获取传入
 * @returns currentTime: 当前播放时间， remainingTime 剩余播放时间
 */
const calcPlayTime = (width = 0) => {
  // 获取触发变更后的百分比
  const percent =
    parseInt(`${(width / playerProgress.value.offsetWidth) * 100}`) / 100;

  // 通过百分比计算，更新当前播放时间
  const currentTime = parseInt(`${totalPlayTime.value * percent}`);

  const remainingTime = totalPlayTime.value - currentTime;

  return { currentTime, remainingTime };
};

/** 获取当前播放时间 */
const getCurrentPleyTime = () => {
  return audio.value ? audio.value.currentTime : 0;
};
/** 设置当前新的播放时间 */
const setCurrentPleyTime = (time = 0) => {
  if (audio.value) audio.value.currentTime = time;
};

/** 设置进度条过渡宽度 */
const setProgressBarTransitionWidth = (width = 0) => {
  progressBarTransition.value = `width:${width}px`;
};
/**
 * 设置当前状态下的进度条宽度
 * @param {*} width 进度条宽度
 * @param {*} remainingTime 剩余时间
 * @param {*} event 触发事件
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

  // console.log(event);

  // 解决渲染过快写入未能生效的问题
  nextTick(() => {
    if (getIsPlaying.value) {
      const time =
        remainingTime === null
          ? currentPlayTime.value || totalPlayTime.value
          : remainingTime;
      style.push(`transition: width ${time / backRate.value}s linear`);
    }
    progressBarTransition.value = style.join(";");
  });
};

/** 获取当前进度条元素 */
const getCurrentProgressBar = () => {
  return playerProgress.value.querySelector(".progress-bar");
};

// Audio 原生事件
const audioEvents = {
  canplay: null,
  timeupdate: null,
  play: null,
  pause: null,
  ended: null,
  error: null,
};

// Audio Event Handlers
const setupAudioEvents = () => {
  if (!audio.value) return;

  audio.value.volume = 1;
  audio.value.muted = false;

  // 加载完成可播放
  audioEvents.canplay = eventListener(audio.value, "canplay", () => {
    currentPlayTime.value = 0;
    totalPlayTime.value = audio.value.duration;

    totalTimeFormatted.value = formatPlayTime(audio.value.duration);
    currentTimeFormatted.value = formatPlayTime(getCurrentPleyTime());

    getPlayStatus.value.isLoading = false;
    apDnd.disabled = false;

    if (isSwitchAudioSrc.value) {
      isSwitchAudioSrc.value = false;
      if (getIsPlaying.value) setAudioPlay();
    }
  });

  // 播放时间更新
  audioEvents.timeupdate = eventListener(audio.value, "timeupdate", () => {
    if (apDnd.isDnD || isJumpProgress.value) return;

    currentTimeFormatted.value = formatPlayTime(getCurrentPleyTime());
  });

  audioEvents.play = eventListener(audio.value, "play", () => {
    setCurrentStateProgressWidth(null, null, "play event trigger");
  });

  audioEvents.pause = eventListener(audio.value, "pause", () => {
    setCurrentStateProgressWidth(null, null, "pause event trigger");
  });

  // 播放结束
  audioEvents.ended = eventListener(audio.value, "ended", () => {
    // 触发状态切换
    store.pause();
  });

  audioEvents.error = eventListener(audio.value, "error", () => {
    store.setError();
    getPlayStatus.value.isLoading = false;
    apDnd.disabled = true;
    currentPlayTime.value = 0;
    totalPlayTime.value = 0;
    currentTimeFormatted.value = "00:00";
    totalTimeFormatted.value = "00:00";

    setCurrentStateProgressWidth(0, 0, "play error trigger");
  });
};

onMounted(() => {
  apDnd = new PlayerProgressDnD(
    playerBox.value,
    playerProgress.value,
    getCurrentProgressBar()
  );
  apDnd.disabled = true;

  setupAudioEvents();

  // 最后存储的剩余时间
  let lastRemainingTime = 0;
  apDnd.on("mousemove", ({ width }) => {
    setProgressBarTransitionWidth(width);

    const { currentTime, remainingTime } = calcPlayTime(width);
    lastRemainingTime = remainingTime; // 记录剩余时间
    currentPlayTime.value = currentTime;
    currentTimeFormatted.value = formatPlayTime(currentTime);
  });

  apDnd.on("mouseup", ({ width }) => {
    if (apDnd.isDnD) return;

    setCurrentStateProgressWidth(width, lastRemainingTime, "mouseup trigger");
    setCurrentPleyTime(currentPlayTime.value);
  });
  apDnd.on("mouseleave", ({ width }) => {
    if (apDnd.isDnD) return;

    setCurrentStateProgressWidth(
      width,
      lastRemainingTime,
      "mouseleave trigger"
    );
    setCurrentPleyTime(currentPlayTime.value);
  });
});

onBeforeUnmount(() => {
  // cleanup all audio events
  Object.keys(audioEvents).forEach((key) => {
    audioEvents[key]();
  });
});

// 切换播放速率
const handleChangePlaybackRate = () => {
  backRate.value = backRate.value === 1 ? 2 : 1;
  audio.value.playbackRate = backRate.value;
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

  const { currentTime, remainingTime } = calcPlayTime(event.offsetX);

  setProgressBarTransitionWidth(event.offsetX);

  nextTick(() => {
    getIsPlaying.value &&
      setCurrentStateProgressWidth(null, remainingTime, "jump trigger");
    setCurrentPleyTime(currentTime);
    isJumpProgress.value = false;
  });
};

// 切换播放状态
const handleChangePlayState = (isPlayState, isPlayer) => {
  if (apDnd.disabled || !getIsPlayerEnable.value) return;
  if (isPlayState) {
    setAudioPlay(isPlayer);
  } else {
    setAudioPause(isPlayer);
  }
};

// 播放音频
const setAudioPlay = (isPlayer) => {
  if (!audio.value) return;
  if (totalPlayTime.value === 0) return;
  if (getPlayStatus.value.isError) return;

  audio.value.play();
  isPlayer && (getPlayStatus.value.isPlaying = true);
};

// 暂停音频
const setAudioPause = (isPlayer) => {
  if (!audio.value) return;
  if (getPlayStatus.value.isError) return;

  audio.value.pause();
  isPlayer && store.pause();
};

const handleUpdateVolume = (value) => {
  audio.value.volume = value / 100;
};

/** 获取是否播放状态 */
const getIsPlaying = computed(() => {
  return getPlayStatus.value.isPlaying;
});

// 是否可启用播放器
const getIsPlayerEnable = computed(() => {
  return getPlayStatus.value.src && !getPlayStatus.value.isError;
});

// 当前播放标题
const currentPlayTitle = computed(() => {
  return getPlayStatus.value.title ? getPlayStatus.value.title : "";
});

// 监听当前播放音频 src 变化
watch(
  () => getPlayStatus.value.src,
  (newSrc, oldSrc) => {
    if (newSrc !== oldSrc) {
      isSwitchAudioSrc.value = true;
      audioSrc.value = getPlayStatus.value.src;
      getPlayStatus.value.isLoading = true;

      setProgressBarTransitionWidth(0);

      const album = getPlayStatus.value.album;
      const isAlbumInfo = album && isObject(album);
      if (isAlbumInfo) {
        if (album.image) {
          updateMediaCover(
            getPlayStatus.value.album,
            getPlayStatus.value.title
          );
        }
        if (isObject(album.theme) && album.theme.color) {
          setThemeStyle(album.theme);
        }
      }
    }
  }
);

// 监听播放状态变化
watch(
  () => getPlayStatus.value.isPlaying,
  (newVal) => {
    if (newVal) {
      setAudioPlay();
    } else {
      setAudioPause();
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
        <!-- <div class="play-prev" @click="handleChangeAudioSrc(-1)">上一首</div> -->
        <PlayButton
          ref="playButton"
          class="play-button"
          @play="handleChangePlayState(true, true)"
          @pause="handleChangePlayState(false, true)"
          :isPlay="getIsPlaying"
          :isDisabled="!getIsPlayerEnable"
        />
        <!-- <div class="play-next" @click="handleChangeAudioSrc(1)">下一首</div> -->
      </div>
      <div class="player-status-bar">
        <!-- <div class="palyer-volume">
          <div class="volume-icon" @click="isVolume = !isVolume"></div>
          <div class="volume-range" v-if="isVolume">
          </div>
        </div> -->
        <div
          class="palyer-back-rate"
          @click="handleChangePlaybackRate"
          v-if="isBackRate"
        >
          {{ backRate === 1 ? "1.x" : "2.x" }}
        </div>
        <div>
          <NPopover
            placement="bottom"
            trigger="click"
            @update:show="handleUpdateShow"
          >
            <template #trigger>
              <n-button>点击</n-button>
            </template>
            <NSlider
              :default-value="volume"
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

    <audio ref="audio" preload="auto" :src="audioSrc"></audio>
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

    .play-prev,
    .play-next {
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
