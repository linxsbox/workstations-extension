<script setup>
import { storePlayer } from "@/stores/global/player";
import IconPlaylistAdd from "@/components/common/Icons/IconPlaylistAdd.vue";

const props = defineProps({
  // 音频轨道信息
  track: {
    type: Object,
    required: true,
    validator: (value) => {
      // 至少需要包含 src
      return value && typeof value.src === "string";
    },
  },
  // 图标尺寸（像素）
  iconSize: {
    type: Number,
    default: 24,
  },
  // 是否显示为图标按钮（否则显示为带文字的按钮）
  iconOnly: {
    type: Boolean,
    default: true,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["success", "error", "duplicate"]);

const player = storePlayer();

/** 添加到队列 */
const handleAddToQueue = () => {
  if (props.disabled) return;

  try {
    const success = player.addToQueue(props.track);

    if (success) {
      emit("success", props.track);
    } else {
      // 已存在于队列中
      emit("duplicate", props.track);
    }
  } catch (error) {
    emit("error", error);
  }
};
</script>

<template>
  <button
    class="add-to-queue-btn flex items-center justify-center rounded"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
      'gap-2 px-3 py-1.5': !iconOnly,
    }"
    :disabled="disabled"
    @click.stop="handleAddToQueue"
    :aria-label="'加入播放列表'"
    title="加入播放列表"
    :style="{ fontSize: `${iconSize}px` }"
  >
    <IconPlaylistAdd class="text-inherit" />
    <span class="text-sm" v-if="!iconOnly">加入列表</span>
  </button>
</template>

<style lang="scss" scoped>
.add-to-queue-btn {
  width: 1em;
  height: 1em;
  background: none;
  border: none;
  color: var(--origin-theme, --player-color-default);
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: rgba(
      var(--play-button-bg-color, --play-button-bg-color-default),
      0.1
    );
  }
}
</style>
