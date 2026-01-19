<script setup>
import { computed } from 'vue';
import { NPopconfirm } from 'naive-ui';
import IconDelete from '@/components/common/Icons/IconDelete.vue';
import IconShare from '@/components/common/Icons/IconShare.vue';
import { NOTES_CONFIG } from './constants';

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select', 'delete', 'share']);

// 格式化时间
const formatTime = (isoString) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取首行内容预览
const previewContent = computed(() => {
  const firstLine = props.note.content.split('\n')[0] || '';
  if (!firstLine) return NOTES_CONFIG.emptyContentPlaceholder;
  return firstLine.length > NOTES_CONFIG.previewMaxLength
    ? firstLine.substring(0, NOTES_CONFIG.previewMaxLength) + '...'
    : firstLine;
});

// 格式化的更新时间
const formattedTime = computed(() => formatTime(props.note.updatedAt));

// 处理选择
const handleSelect = () => {
  emit('select', props.note.id);
};

// 处理删除
const handleDelete = () => {
  emit('delete', props.note.id);
};

// 处理分享
const handleShare = () => {
  emit('share', props.note.id);
};
</script>

<template>
  <div
    class="note-item p-3 mb-2 rounded cursor-pointer transition-all"
    :class="{ active: isActive }"
    @click="handleSelect"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <div class="note-title font-medium text-sm mb-1 truncate">
          {{ note.title }}
        </div>
        <div class="note-preview text-xs text-[var(--text-tertiary)] mb-2">
          {{ previewContent }}
        </div>
        <div class="note-time text-xs text-[var(--text-tertiary)]">
          {{ formattedTime }}
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <!-- 删除按钮 -->
        <NPopconfirm
          @positive-click="handleDelete"
          positive-text="确定"
          negative-text="取消"
        >
          <template #trigger>
            <button
              class="action-btn flex-none opacity-0 hover:opacity-100 transition-opacity"
              @click.stop
              title="删除"
            >
              <IconDelete class="text-base text-[var(--color-error)]" />
            </button>
          </template>
          确定要删除这条笔记吗？
        </NPopconfirm>

        <!-- 分享按钮 -->
        <button
          class="action-btn flex-none opacity-0 hover:opacity-100 transition-opacity"
          @click.stop="handleShare"
          title="分享"
        >
          <IconShare class="text-base text-[var(--color-info)]" />
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.note-item {
  @apply shadow-sm hover:shadow-md;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);

  &:hover {
    background-color: var(--state-hover);

    .action-btn {
      opacity: 1;
    }
  }

  &.active {
    background-color: var(--interactive-bg-hover);
    border-color: var(--color-primary);
  }

  .action-btn {
    @apply rounded transition-opacity;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
