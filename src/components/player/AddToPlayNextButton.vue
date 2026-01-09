<script setup>
import { storePlayer } from "@/stores/modules/player";
import IconPlaylistPlay from "@/components/common/Icons/IconPlaylistPlay.vue";

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

const emit = defineEmits(["success", "error"]);

const player = storePlayer();

/** 添加为下一首播放 */
const handleAddToPlayNext = () => {
  if (props.disabled) return;

  try {
    const success = player.addToPlayNext(props.track);

    if (success) {
      emit("success", props.track);
    } else {
      emit("error", new Error("添加失败"));
    }
  } catch (error) {
    emit("error", error);
  }
};
</script>

<template>
  <button
    class="add-to-play-next-btn flex items-center justify-center rounded"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
      'gap-2 px-3 py-1.5': !iconOnly,
    }"
    :disabled="disabled"
    @click.stop="handleAddToPlayNext"
    aria-label="下一首播放"
    title="下一首播放"
    :style="{ fontSize: `${iconSize}px` }"
  >
    <IconPlaylistPlay />
    <span class="text-sm" v-if="!iconOnly">下一首播放</span>
  </button>
</template>

<style lang="scss" scoped>
.add-to-play-next-btn {
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
