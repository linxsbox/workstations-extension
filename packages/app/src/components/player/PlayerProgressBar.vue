<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { storePlayer } from '@/stores/global/player';
import { formatPlayTime, PlayerProgressDnD } from './config';

// Store
const player = storePlayer();
const { currentTime, duration, playbackRate, getPlayStatus } = storeToRefs(player);

// Refs
const playerBox = ref(null);
const playerProgress = ref(null);
const progressBarTransition = ref('');
let apDnd = null;

// 事件取消函数
const unsubscribers = [];

/**
 * 计算播放时长状态
 */
const calcPlayTime = (width = 0) => {
  if (!playerProgress.value?.offsetWidth || !duration.value) {
    return { currentTime: 0, remainingTime: 0 };
  }

  const percent =
    parseInt(`${(width / playerProgress.value.offsetWidth) * 100}`) / 100;
  const currentTime = parseInt(`${duration.value * percent}`);
  const remainingTime = duration.value - currentTime;
  return { currentTime, remainingTime };
};

/** 获取当前进度条元素 */
const currentProgressBarEl = () => {
  return playerProgress.value.querySelector('.progress-bar');
};

/** 设置进度条过渡宽度 */
const setProgressBarTransitionWidth = (width = 0) => {
  progressBarTransition.value = `width:${width}px`;
};

/**
 * 设置当前状态下的进度条宽度
 */
const setCurrentStateProgressWidth = (width = 0, remainingTime) => {
  const style = [
    `width:${
      typeof width === 'number' && !isNaN(width)
        ? width
        : getIsPlaying.value
        ? (playerProgress.value || {}).offsetWidth || 0
        : currentProgressBarEl().offsetWidth
    }px`,
  ];

  nextTick(() => {
    if (getIsPlaying.value) {
      const time =
        remainingTime === null
          ? duration.value - currentTime.value  // 使用剩余时间
          : remainingTime;
      style.push(`transition: width ${time / playbackRate.value}s linear`);
    }
    progressBarTransition.value = style.join(';');
  });
};

onMounted(() => {
  // 初始化进度条拖拽
  apDnd = new PlayerProgressDnD(
    playerBox.value,
    playerProgress.value,
    currentProgressBarEl()
  );
  apDnd.disabled = true;

  let lastRemainingTime = 0;
  apDnd.on('mousemove', ({ width }) => {
    setProgressBarTransitionWidth(width);
    const { remainingTime } = calcPlayTime(width);
    lastRemainingTime = remainingTime;
  });

  apDnd.on('mouseup', ({ width }) => {
    if (apDnd.isDnD) return;
    setCurrentStateProgressWidth(width, lastRemainingTime, 'mouseup trigger');
    player.seek(calcPlayTime(width).currentTime);
  });

  apDnd.on('mouseleave', ({ width }) => {
    if (apDnd.isDnD) return;
    setCurrentStateProgressWidth(
      width,
      lastRemainingTime,
      'mouseleave trigger'
    );
    player.seek(calcPlayTime(width).currentTime);
  });

  nextTick(() => {
    const currentWidth = currentProgressBarEl().offsetWidth
    if (getIsPlaying.value && currentProgressBarEl() && currentWidth === 0) {
      const updateCurrentWidth = (currentTime.value / duration.value) * playerProgress.value.offsetWidth
      setProgressBarTransitionWidth(updateCurrentWidth)
      nextTick(() => {
        setCurrentStateProgressWidth(null, null, 'player progress bar rerender');
      })
    }
  }, 300)

  // ==================== 事件驱动 UI 更新 ====================

  // 监听 canplay 事件 - 音频可以播放
  unsubscribers.push(
    player.onPlayerEvent('canplay', () => {
      setProgressBarTransitionWidth(0);
      apDnd.disabled = false;
    })
  );

  // 监听 play 事件 - 开始播放
  unsubscribers.push(
    player.onPlayerEvent('play', () => {
      setCurrentStateProgressWidth(null, null, 'play event');
      apDnd.disabled = false;
    })
  );

  // 监听 pause 事件 - 暂停播放
  unsubscribers.push(
    player.onPlayerEvent('pause', () => {
      setCurrentStateProgressWidth(null, null, 'pause event');
    })
  );

  // 监听 ended 事件 - 播放完成
  unsubscribers.push(
    player.onPlayerEvent('ended', () => {
      setProgressBarTransitionWidth(0);
    })
  );

  // 监听 loadstart 事件 - 开始加载新音频
  unsubscribers.push(
    player.onPlayerEvent('loadstart', () => {
      setProgressBarTransitionWidth(0);
      apDnd.disabled = true;
    })
  );

  // 监听 error 事件 - 播放错误
  unsubscribers.push(
    player.onPlayerEvent('error', () => {
      setProgressBarTransitionWidth(0);
      apDnd.disabled = true;
    })
  );
});

onUnmounted(() => {
  // 取消所有事件监听
  unsubscribers.forEach(unsub => unsub());
});

// 进度条拖动
const handleProgressDnD = (event) => {
  apDnd.handleDnD(event);
};

// 点击进度条跳转
const handleJumpProgress = (event) => {
  if (apDnd.isDnD || !getIsPlayerEnable.value) return;
  event.stopPropagation();

  const { currentTime: ct, remainingTime } = calcPlayTime(event.offsetX);

  setProgressBarTransitionWidth(event.offsetX);

  nextTick(() => {
    getIsPlaying.value &&
      setCurrentStateProgressWidth(null, remainingTime, 'jump trigger');
    player.seek(ct);
  });
};

/** 获取是否播放状态 */
const getIsPlaying = computed(() => {
  return getPlayStatus.value.isPlaying;
});

/** 是否可启用播放器 */
const getIsPlayerEnable = computed(() => {
  return getPlayStatus.value.src && !getPlayStatus.value.isError;
});

/** 当前时间格式化 */
const currentTimeFormatted = computed(() => {
  return formatPlayTime(currentTime.value);
});

/** 总时间格式化 */
const totalTimeFormatted = computed(() => {
  return formatPlayTime(duration.value);
});
</script>

<template>
  <div ref="playerBox" class="player-progress-bar">
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
</template>

<style lang="scss" scoped>
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
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }
}

.player-progress {
  position: relative;
  flex: 1 1 0%;
  width: 100%;
  height: 8px;
  background-color: var(--player-progress-slider-bar-default);
  border-radius: 999px;
  will-change: width;
  cursor: pointer;

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
    background-color: var(--player-progress-slider-bg-default);
    border-radius: inherit;
    box-shadow: 0 0 3px 0 rgba(var(--color-black-rgb), 0.35);
    pointer-events: auto;

    &:after {
      content: "";
      flex: none;
      width: 8px;
      height: 8px;
      background-color: var(
        --player-progress-slider,
        var(--player-color-default)
      );
      border-radius: inherit;
      box-shadow: 0 1px 1px 0 rgba(var(--color-black-rgb), 0.35);
    }
  }
}
</style>
