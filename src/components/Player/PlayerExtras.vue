<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { NPopover, NSlider, NPopselect } from "naive-ui";
import { storePlayer } from "@/stores/modules/player";
import { PlayMode, PlayModeConfig } from "@/stores/modules/player/types";
import IconVolumeUp from "@/components/common/Icons/IconVolumeUp.vue";
import IconVolumeDown from "@/components/common/Icons/IconVolumeDown.vue";
import IconVolumeMute from "@/components/common/Icons/IconVolumeMute.vue";
import IconVolumeOff from "@/components/common/Icons/IconVolumeOff.vue";
import IconSquare from "@/components/common/Icons/IconSquare.vue";
import IconRepeat from "@/components/common/Icons/IconRepeat.vue";
import IconRepeatOne from "@/components/common/Icons/IconRepeatOne.vue";
import IconShuffle from "@/components/common/Icons/IconShuffle.vue";
import IconPlayListNote from "@/components/common/Icons/IconPlayListNote.vue";

const props = defineProps({
  showStop: { type: Boolean, default: true },
  showVolume: { type: Boolean, default: true },
  showBackRate: { type: Boolean, default: true },
  showPlayMode: { type: Boolean, default: true },
});

// Store
const player = storePlayer();
const { volume, playbackRate, playMode, getPlayStatus } = storeToRefs(player);

/** 是否可启用播放器 */
const getIsPlayerEnable = computed(() => {
  return getPlayStatus.value.src && !getPlayStatus.value.isError;
});

/** 当前播放模式配置 */
const currentPlayModeConfig = computed(() => {
  return PlayModeConfig[playMode.value] || PlayModeConfig.loop;
});

/** 当前播放模式图标组件 */
const currentPlayModeIcon = computed(() => {
  switch (playMode.value) {
    case PlayMode.SEQUENTIAL:
      return IconPlayListNote; // 顺序播放
    case PlayMode.LOOP:
      return IconRepeat; // 列表循环
    case PlayMode.RANDOM:
      return IconShuffle; // 随机播放
    case PlayMode.SINGLE:
      return IconRepeatOne; // 单曲循环
    default:
      return IconRepeat;
  }
});

/** 倍速选项 */
const playbackRateOptions = [
  { label: "2.0x", value: 2 },
  { label: "1.5x", value: 1.5 },
  { label: "1.0x", value: 1 },
  { label: "0.75x", value: 0.75 },
  { label: "0.5x", value: 0.5 },
];

// 停止
const handleStop = () => {
  if (!getIsPlayerEnable.value) return;
  player.stop();
};

// 切换播放速率
const handleChangePlaybackRate = (value) => {
  player.setPlaybackRate(value);
};

/** 当前倍速显示文本 */
const playbackRateText = computed(() => {
  return `${playbackRate.value}x`;
});

// 静音状态管理
const isMuted = ref(false);
const volumeBeforeMute = ref(1); // 静音前的音量

/** 音量百分比值（0-100，修正小数精度问题） */
const volumePercent = computed({
  get: () => {
    // 如果是静音状态，显示为 0
    if (isMuted.value) return 0;
    // 修正小数精度问题，四舍五入到整数
    return Math.round(volume.value * 100);
  },
  set: (value) => {
    // 转换为 0-1 的浮点数，保留两位小数避免精度问题
    const normalizedValue = Math.round(value) / 100;

    // 如果设置的音量大于 0，自动取消静音
    if (normalizedValue > 0 && isMuted.value) {
      isMuted.value = false;
    }

    // 如果设置为 0，进入静音状态
    if (normalizedValue === 0 && !isMuted.value) {
      volumeBeforeMute.value = volume.value;
      isMuted.value = true;
    }

    player.setVolume(normalizedValue);
  },
});

/** 当前音量图标组件 */
const currentVolumeIcon = computed(() => {
  // 静音或音量为 0
  if (isMuted.value || volume.value === 0) {
    return IconVolumeOff;
  }

  const percent = Math.round(volume.value * 100);

  // 80-100: IconVolumeUp
  if (percent >= 80) {
    return IconVolumeUp;
  }
  // 40-79: IconVolumeDown
  if (percent >= 40) {
    return IconVolumeDown;
  }
  // 1-39: IconVolumeMute
  return IconVolumeMute;
});

/** 音量图标标题 */
const volumeIconTitle = computed(() => {
  if (isMuted.value) return "取消静音";
  if (volume.value === 0) return "音量: 0%";
  return `音量: ${volumePercent.value}%`;
});

/** 切换静音状态 */
const toggleMute = () => {
  if (isMuted.value) {
    // 取消静音：恢复之前的音量
    isMuted.value = false;
    const restoreVolume =
      volumeBeforeMute.value > 0 ? volumeBeforeMute.value : 0.5;
    player.setVolume(restoreVolume);
  } else {
    // 静音：保存当前音量并设为 0
    volumeBeforeMute.value = volume.value;
    isMuted.value = true;
    player.setVolume(0);
  }
};

// 切换播放模式
const handleSwitchPlayMode = () => {
  player.switchPlayMode();
};
</script>

<template>
  <div class="player-extras flex items-center gap-2 flex-none">
    <!-- 停止按钮 -->
    <button
      v-if="showStop"
      class="extra-btn"
      :disabled="!getIsPlayerEnable"
      @click="handleStop"
      aria-label="停止"
      title="停止"
    >
      <IconSquare class="text-2xl" />
    </button>

    <!-- 音量控制 -->
    <div v-if="showVolume">
      <NPopover
        class="p-2"
        placement="bottom"
        trigger="click"
        :show-arrow="false"
      >
        <template #trigger>
          <button
            class="extra-btn volume-btn"
            :aria-label="volumeIconTitle"
            :title="volumeIconTitle"
          >
            <component :is="currentVolumeIcon" class="volume-icon text-2xl" />
          </button>
        </template>
        <div class="flex flex-col items-center gap-2 w-6">
          <!-- 音量百分比 -->
          <div
            class="volume-value w-6 text-xs text-[var(--text-color-3)] text-center cursor-pointer"
          >
            {{ volumePercent }}
          </div>

          <!-- 音量滑块 -->
          <NSlider
            v-model:value="volumePercent"
            vertical
            :step="1"
            :min="0"
            :max="100"
            :tooltip="false"
            style="height: 100px"
          />

          <!-- 静音切换按钮 -->
          <div
            class="mute-toggle-btn transition-colors cursor-pointer"
            @click="toggleMute"
            :aria-label="isMuted ? '取消静音' : '静音'"
            :title="isMuted ? '取消静音' : '静音'"
          >
            <IconVolumeOff class="text-lg text-[var(--text-color-3)]" />
          </div>
        </div>
      </NPopover>
    </div>

    <!-- 倍速切换 -->
    <div v-if="showBackRate">
      <NPopselect
        :value="playbackRate"
        :options="playbackRateOptions"
        @update:value="handleChangePlaybackRate"
        size="small"
        trigger="click"
      >
        <div
          class="palyer-back-rate size-7 flex items-center justify-center rounded"
          :title="`播放速率: ${playbackRateText}`"
        >
          {{ playbackRateText }}
        </div>
      </NPopselect>
    </div>

    <!-- 播放模式切换 -->
    <button
      v-if="showPlayMode"
      class="extra-btn"
      @click="handleSwitchPlayMode"
      :aria-label="currentPlayModeConfig.label"
      :title="currentPlayModeConfig.label"
    >
      <component :is="currentPlayModeIcon" class="text-2xl" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.player-extras {
  .extra-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    background: none;
    border: none;
    color: var(--player-color, var(--player-color-default));
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
    border-radius: 4px;

    &:hover:not(:disabled) {
      opacity: 1;
      background-color: rgba(
        var(--play-button-bg-color, var(--play-button-bg-color-default)),
        0.1
      );
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .palyer-back-rate {
    color: var(--player-color, var(--player-color-default));
    background-color: rgba(
      var(--play-button-bg-color, var(--play-button-bg-color-default)),
      0.1
    );

    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
      background-color: rgba(
        var(--play-button-bg-color, var(--play-button-bg-color-default)),
        0.2
      );
    }
  }
}
</style>
