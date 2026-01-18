<script setup>
import { computed } from 'vue';
import { NButton, NPopconfirm } from 'naive-ui';
import IconAssignmentAdd from '@/components/common/Icons/IconAssignmentAdd.vue';
import IconShare from '@/components/common/Icons/IconShare.vue';
import IconDelete from '@/components/common/Icons/IconDelete.vue';
import { timeBefore } from '@/utils/time';

const props = defineProps({
  note: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Object,
    default: () => ({ title: '', content: '' }),
  },
});

const emit = defineEmits(['update:modelValue', 'save', 'create', 'delete', 'share']);

// 格式化更新时间
const formattedUpdateTime = computed(() => {
  if (!props.note?.updatedAt) return '';
  return timeBefore(new Date(), props.note.updatedAt);
});

const handleTitleInput = (e) => {
  emit('update:modelValue', { ...props.modelValue, title: e.target.value });
};

const handleContentInput = (e) => {
  emit('update:modelValue', { ...props.modelValue, content: e.target.value });
};

const handleSave = () => {
  emit('save');
};

const handleCreate = () => {
  emit('create');
};

const handleDelete = () => {
  if (props.note?.id) {
    emit('delete', props.note.id);
  }
};

const handleShare = () => {
  if (props.note?.id) {
    emit('share', props.note.id);
  }
};
</script>

<template>
  <div class="flex-1 flex flex-col bg-[var(--bg-primary)]">
    <!-- 有选中笔记时显示编辑器 -->
    <div v-if="note" class="flex-1 flex flex-col min-h-0">
      <!-- 头部栏：标题 + 功能区 -->
      <div class="flex items-center gap-3 p-3 border-b border-[var(--border-color)]">
        <!-- 左侧：标题输入 -->
        <input
          type="text"
          :value="modelValue.title"
          placeholder="笔记标题"
          class="flex-1 text-lg font-semibold text-[var(--text-primary)] bg-transparent border-none outline-none placeholder:text-[var(--text-tertiary)]"
          @input="handleTitleInput"
          @blur="handleSave"
        />

        <!-- 右侧：功能区 -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <!-- 最后更新时间 -->
          <span class="text-sm text-[var(--text-tertiary)]">
            {{ formattedUpdateTime }}
          </span>

          <!-- 分享按钮 -->
          <NButton
            text
            size="small"
            @click="handleShare"
            title="分享笔记"
          >
            <template #icon>
              <IconShare />
            </template>
          </NButton>

          <!-- 删除按钮（带二次确认） -->
          <NPopconfirm
            @positive-click="handleDelete"
            positive-text="确定"
            negative-text="取消"
          >
            <template #trigger>
              <NButton
                text
                size="small"
                title="删除笔记"
              >
                <template #icon>
                  <IconDelete />
                </template>
              </NButton>
            </template>
            确定要删除这条笔记吗？
          </NPopconfirm>
        </div>
      </div>

      <!-- 内容编辑区 -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <textarea
          :value="modelValue.content"
          placeholder="开始记录..."
          class="w-full h-full p-4 text-base leading-relaxed text-[var(--text-primary)] bg-transparent border-none outline-none resize-none overflow-y-auto placeholder:text-[var(--text-tertiary)] scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-track-transparent"
          @input="handleContentInput"
          @blur="handleSave"
        ></textarea>
      </div>
    </div>

    <!-- 未选中笔记时显示空状态 -->
    <div
      v-else
      class="flex-1 flex items-center justify-center cursor-pointer"
      @dblclick="handleCreate"
    >
      <div
        class="flex flex-col justify-center items-center gap-3 text-center text-[var(--text-tertiary)]"
      >
        <IconAssignmentAdd class="text-6xl" />
        <div class="text-base">双击创建新笔记</div>
      </div>
    </div>
  </div>
</template>

