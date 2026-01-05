<script setup>
import { storePlayer } from '@/stores/modules/player';
import IconPlaylistPlay from '@/components/common/Icons/IconPlaylistPlay.vue';

const props = defineProps({
  // 音频轨道信息
  track: {
    type: Object,
    required: true,
    validator: (value) => {
      // 至少需要包含 src
      return value && typeof value.src === 'string';
    }
  },
  // 图标尺寸（像素）
  iconSize: {
    type: Number,
    default: 24
  },
  // 是否显示为图标按钮（否则显示为带文字的按钮）
  iconOnly: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['success', 'error']);

const player = storePlayer();

/** 添加为下一首播放 */
const handleAddToPlayNext = () => {
  if (props.disabled) return;

  try {
    const success = player.addToPlayNext(props.track);

    if (success) {
      emit('success', props.track);
      console.log('[AddToPlayNextButton] 已添加为下一首:', props.track.title || props.track.src);
    } else {
      emit('error', new Error('添加失败'));
      console.error('[AddToPlayNextButton] 添加失败');
    }
  } catch (error) {
    emit('error', error);
    console.error('[AddToPlayNextButton] 添加异常:', error);
  }
};
</script>

<template>
  <button
    class="add-to-play-next-btn flex items-center justify-center rounded transition-all"
    :class="{
      'opacity-50 cursor-not-allowed': disabled,
      'gap-2 px-3 py-1.5': !iconOnly
    }"
    :disabled="disabled"
    @click.stop="handleAddToPlayNext"
    :title="`下一首播放${track.title ? ': ' + track.title : ''}`"
    :aria-label="'下一首播放'"
    :style="{ fontSize: `${iconSize}px` }"
  >
    <IconPlaylistPlay />
    <span class="text-sm" v-if="!iconOnly">下一首播放</span>
  </button>
</template>

<style lang="scss" scoped>
.add-to-play-next-btn {
  background: none;
  border: none;
  color: var(--text-secondary, #666);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--player-color, #409eff);
    background: rgba(64, 158, 255, 0.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
}
</style>
