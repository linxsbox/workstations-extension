<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { NModal, useDialog } from "naive-ui";
import { isObject } from "@linxs/toolkit";
import { storePlayer } from "@/stores/modules/player";
import { ViewMode } from "@/stores/modules/player/types";
import { updateMediaCover } from "./config";
import PlayerMini from "./modes/PlayerMini.vue";
import PlayerList from "./modes/PlayerList.vue";
import PlayerStandard from "./modes/PlayerStandard.vue";
import IconClose from "@/components/common/Icons/IconClose.vue";

const props = defineProps({
  showBackRate: { type: Boolean, default: true },
  showStop: { type: Boolean, default: true },
  showVolume: { type: Boolean, default: true },
  showPlayMode: { type: Boolean, default: true },
  // 是否显示模式切换按钮
  showModeSwitch: { type: Boolean, default: true },
});

// 对话框
const dialog = useDialog();

// Store
const store = storePlayer();
const { getPlayStatus, getViewMode, getIsPlayerVisible } = storeToRefs(store);

/** 播放器显示状态（支持双向绑定） */
const isPlayerVisible = computed({
  get: () => getIsPlayerVisible.value,
  set: (value) => {
    if (value) {
      store.showPlayer();
    } else {
      store.hidePlayer();
    }
  },
});

onMounted(() => {
  // 初始化音频管理器
  store.initAudioManager();
});

onBeforeUnmount(() => {
  // 清理会在这里处理
});

/** 当前播放标题 */
const currentPlayTitle = computed(() => {
  return getPlayStatus.value.title || "";
});

/** 当前视图模式组件 */
const currentModeComponent = computed(() => {
  switch (getViewMode.value) {
    case ViewMode.MINI:
      return PlayerMini;
    case ViewMode.STANDARD:
      return PlayerStandard;
    case ViewMode.LIST:
    default:
      return PlayerList;
  }
});

/** 模式切换选项 */
const modeOptions = [
  { value: ViewMode.MINI, label: "Mini", icon: "━" },
  { value: ViewMode.LIST, label: "列表", icon: "☰" },
  { value: ViewMode.STANDARD, label: "标准", icon: "◫" },
];

/** 当前模式的显示信息 */
const currentModeInfo = computed(() => {
  return (
    modeOptions.find((opt) => opt.value === getViewMode.value) || modeOptions[1]
  );
});

/** 切换到下一个模式 */
const switchToNextMode = () => {
  const currentIndex = modeOptions.findIndex(
    (opt) => opt.value === getViewMode.value
  );
  const nextIndex = (currentIndex + 1) % modeOptions.length;
  store.setViewMode(modeOptions[nextIndex].value);
};

/** 监听播放源变化，更新封面等 */
watch(
  () => getPlayStatus.value.src,
  (newSrc) => {
    if (newSrc) {
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

/** 关闭播放器 */
const handleClose = () => {
  dialog.warning({
    title: "确认关闭",
    content: "关闭播放器将停止当前播放，确定要关闭吗？",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: () => {
      // 停止播放
      store.stop();
      // 隐藏播放器
      store.hidePlayer();
    },
  });
};
</script>

<template>
  <NModal
    v-model:show="isPlayerVisible"
    :mask-closable="false"
    :close-on-esc="false"
    :auto-focus="false"
    transform-origin="center"
  >
    <div
      class="player-view-container relative inline-flex max-w-[95vw] max-h-[95vh]"
      :style="themeStyle"
    >
      <!-- Header 头部 -->
      <header
        class="player-header absolute top-0 left-0 ring-0 z-10 w-full h-10 flex items-center"
      >
        <!-- 左侧：模式切换 -->
        <div class="header-left h-full flex-none flex items-center gap-1">
          <div
            v-for="mode in modeOptions"
            :key="mode.value"
            class="mode-option px-3 py-1.5 text-xs cursor-pointer transition-all"
            :class="{ active: getViewMode === mode.value }"
            @click="store.setViewMode(mode.value)"
            :title="mode.label"
          >
            {{ mode.label }}
          </div>
        </div>

        <!-- 中间：占位 -->
        <div class="header-center h-full flex-1"></div>

        <!-- 右侧：关闭按钮 -->
        <div class="header-right h-full flex-none">
          <div
            class="close-btn h-full w-10 flex items-center justify-center cursor-pointer"
            @click="handleClose"
            title="关闭播放器"
          >
            <IconClose class="text-2xl" />
          </div>
        </div>
      </header>

      <section>
        <!-- 动态模式组件 -->
        <component
          :is="currentModeComponent"
          :showBackRate="showBackRate"
          :showStop="showStop"
          :showVolume="showVolume"
          :showPlayMode="showPlayMode"
        />
      </section>
    </div>
  </NModal>
</template>

<style lang="scss" scoped>
.player-view-container {
  --player-color-default: #409eff;
  --play-button-bg-color-default: 64, 158, 255;
  --player-bg-default: #fff;
  --player-border-defult: none;
  --player-border-radius-defult: none;
  --player-progress-slider-default: rgba(0, 145, 255, 0.6);
  --player-progress-slider-bg-default: #fff;
  --player-progress-slider-bar-default: rgba(216, 216, 216, 0.7);
}

.mode-option {
  background: none;
  border: none;
  color: var(--text-secondary, #666);
  border-radius: 4px;

  &:hover {
    color: var(--player-color, #409eff);
    background: rgba(64, 158, 255, 0.1);
  }

  &.active {
    color: var(--player-color, #409eff);
    background: rgba(64, 158, 255, 0.15);
    font-weight: 500;
  }
}

.close-btn {
  color: var(--text-secondary, #666);
  transition: all 0.2s;

  &:hover {
    color: #ff4d4f;
    background: rgba(255, 77, 79, 0.1);
  }
}
</style>
