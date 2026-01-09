<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { NModal, useDialog } from "naive-ui";
import { delay } from "@linxs/toolkit";
import { storePlayer } from "@/stores/modules/player";
import { ViewMode } from "@/stores/modules/player/types";
import { PlayerDragManager } from "./config";
import PlayerMini from "./modes/PlayerMini.vue";
import PlayerList from "./modes/PlayerList.vue";
import PlayerStandard from "./modes/PlayerStandard.vue";
import IconMinimize from "@/components/common/Icons/IconMinimize.vue";
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

/** 主题样式（从 store computed 获取） */
const themeStyle = computed(() => store.getThemeStyle);

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

/** 列表模式不显示遮罩，标准模式显示遮罩 */
const showMask = computed(() => getViewMode.value === ViewMode.STANDARD);

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

/** 最小化播放器 */
const handleMinimize = () => {
  // 直接隐藏播放器，不停止播放
  store.hidePlayer();
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

// ==================== 拖动功能 ====================
const playerContainerRef = ref(null);
let dragManager = null;

/** 是否允许拖动（标准模式不允许拖动） */
const isDraggable = computed(() => getViewMode.value !== ViewMode.STANDARD);

/** 处理 mousedown 事件 */
const handleMouseDown = (event) => {
  if (isDraggable.value && dragManager) {
    dragManager.handleDragStart(event);
  }
};

/** 初始化拖动管理器 */
const initDragManager = async () => {
  // 如果播放器不可见，不需要初始化
  if (!isPlayerVisible.value) return;

  // 等待 DOM 更新
  await nextTick();
  // 延迟等待 NModal 完全渲染
  await delay(0);

  if (playerContainerRef.value) {
    // 如果已经存在，先销毁旧的
    if (dragManager) {
      dragManager.destroy();
    }

    // 创建新的拖动管理器
    dragManager = new PlayerDragManager(playerContainerRef.value);

    // 恢复位置（如果可拖动）
    if (isDraggable.value) {
      dragManager.restorePosition();
    }
  }
};

// 监听播放器显示状态，在显示时初始化拖动管理器
watch(isPlayerVisible, (newVal) => {
  if (newVal) {
    initDragManager();
  }
});

// 监听视图模式变化，容器重新渲染时重新初始化拖动管理器
watch(getViewMode, () => {
  if (isPlayerVisible.value) {
    initDragManager();
  }
});

onMounted(() => {
  // 初始化音频管理器
  store.initAudioManager();
});

onBeforeUnmount(() => {
  // 清理拖动管理器
  if (dragManager) {
    dragManager.destroy();
    dragManager = null;
  }
});
</script>

<template>
  <NModal
    v-model:show="isPlayerVisible"
    :mask-closable="false"
    :close-on-esc="false"
    :auto-focus="false"
    :show-mask="showMask"
    transform-origin="center"
    display-directive="show"
  >
    <div
      ref="playerContainerRef"
      class="player-view-container relative inline-flex max-w-[95vw] max-h-[95vh]"
      :class="isDraggable && { 'is-dragging': dragManager?.isDragging }"
      :style="themeStyle"
    >
      <!-- Header 头部 -->
      <header
        class="player-header absolute top-0 left-0 right-0 z-10 w-full h-10 flex items-center backdrop-blur-md"
        @mousedown="handleMouseDown"
      >
        <!-- 左侧：模式切换 -->
        <div class="header-left h-full flex-none flex items-center gap-1" :class="{ 'cursor-move': isDraggable }">
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

        <!-- 中间：占位 / 拖动区域 -->
        <div class="header-center h-full flex-1" :class="{ 'cursor-move': isDraggable }">
        </div>

        <!-- 右侧：最小化和关闭按钮 -->
        <div class="header-right h-full flex-none flex items-center">
          <!-- 最小化按钮 -->
          <div
            class="minimize-btn h-full w-10 flex items-center justify-center cursor-pointer"
            @click="handleMinimize"
            title="最小化播放器"
          >
            <IconMinimize class="text-2xl" />
          </div>
          <!-- 关闭按钮 -->
          <div
            class="close-btn h-full w-10 flex items-center justify-center cursor-pointer"
            @click="handleClose"
            title="关闭播放器"
          >
            <IconClose class="text-2xl" />
          </div>
        </div>
      </header>

      <section class="bg-white/15 backdrop-blur-sm">
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
@import "@/assets/player-theme.scss";

.player-view-container {
  background-color: var(--player-bg-default);
  transition: box-shadow 0.2s ease;

  // 拖动时的样式
  &.is-dragging {
    cursor: move;
    user-select: none;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }

  // 最小化按钮（仅该组件使用）
  --player-minimize-hover-color: var(--color-green);
  --player-minimize-hover-bg: rgba(var(--color-green-rgb), 0.12);

  // 关闭按钮（仅该组件使用）
  --player-close-hover-color: var(--color-red);
  --player-close-hover-bg: rgba(var(--color-red-rgb), 0.12);
}

.player-header {
  background: var(--player-header-bg);
}

.mode-option {
  color: var(--player-header-text-color);

  &:hover {
    color: var(--player-header-hover-color);
    // background: var(--player-header-bg-hover);
  }

  &.active {
    color: var(--player-color, #409eff);
    background: rgba(
      var(--play-button-bg-color, --play-button-bg-color-default),
      0.15
    );
  }
}

.minimize-btn {
  color: var(--player-header-icon-color);

  &:hover {
    color: var(--player-minimize-hover-color);
    background: var(--player-minimize-hover-bg);
  }
}

.close-btn {
  color: var(--player-header-icon-color);

  &:hover {
    color: var(--player-close-hover-color);
    background: var(--player-close-hover-bg);
  }
}
</style>
