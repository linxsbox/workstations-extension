<script setup>
import { computed } from 'vue';
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
  // 按钮尺寸：'small' | 'medium' | 'large'
  size: {
    type: String,
    default: 'medium'
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

/** 获取按钮尺寸类名 */
const sizeClass = computed(() => {
  const sizeMap = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };
  return sizeMap[props.size] || sizeMap.medium;
});

/** 获取图标尺寸 */
const iconSize = computed(() => {
  const sizeMap = {
    small: '16px',
    medium: '20px',
    large: '24px'
  };
  return sizeMap[props.size] || sizeMap.medium;
});

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
    v-if="iconOnly"
    class="add-to-play-next-btn flex items-center justify-center rounded transition-all"
    :class="[sizeClass, { 'opacity-50 cursor-not-allowed': disabled }]"
    :disabled="disabled"
    @click.stop="handleAddToPlayNext"
    :title="`下一首播放${track.title ? ': ' + track.title : ''}`"
    :aria-label="'下一首播放'"
  >
    <IconPlaylistPlay :style="{ width: iconSize, height: iconSize }" />
  </button>

  <button
    v-else
    class="add-to-play-next-btn-text flex items-center gap-2 px-3 py-1.5 rounded transition-all"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    :disabled="disabled"
    @click.stop="handleAddToPlayNext"
    :aria-label="'下一首播放'"
  >
    <IconPlaylistPlay :style="{ width: iconSize, height: iconSize }" />
    <span class="text-sm">下一首播放</span>
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

.add-to-play-next-btn-text {
  background: none;
  border: 1px solid var(--border-color, #ddd);
  color: var(--text-primary, #333);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--player-color, #409eff);
    border-color: var(--player-color, #409eff);
    background: rgba(64, 158, 255, 0.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}
</style>
