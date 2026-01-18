<script setup>
import { NScrollbar, NButton, NEmpty, NInput } from 'naive-ui';
import IconAssignmentAdd from '@/components/common/Icons/IconAssignmentAdd.vue';
import NoteItem from './NoteItem.vue';

const props = defineProps({
  notes: {
    type: Array,
    required: true,
  },
  selectedNoteId: {
    type: String,
    default: null,
  },
  searchKeyword: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['create', 'select', 'delete', 'share', 'update:searchKeyword']);

const handleCreate = () => {
  emit('create');
};

const handleSelect = (noteId) => {
  emit('select', noteId);
};

const handleDelete = (noteId) => {
  emit('delete', noteId);
};

const handleSearchUpdate = (value) => {
  emit('update:searchKeyword', value);
};

const handleShare = (noteId) => {
  emit('share', noteId);
};
</script>

<template>
  <div class="notes-list flex-none w-80 flex flex-col border-r">
    <div class="p-3 border-b space-y-2">
      <NInput
        :value="searchKeyword"
        placeholder="搜索笔记..."
        size="small"
        clearable
        @update:value="handleSearchUpdate"
      />

      <NButton
        type="primary"
        size="small"
        block
        @click="handleCreate"
      >
        <template #icon>
          <IconAssignmentAdd />
        </template>
        新建笔记
      </NButton>
    </div>
    <NScrollbar class="flex-1">
      <div class="p-2">
        <NoteItem
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :is-active="selectedNoteId === note.id"
          @select="handleSelect"
          @delete="handleDelete"
          @share="handleShare"
        />

        <NEmpty
          v-if="notes.length === 0"
          description="暂无笔记，双击右侧创建新笔记"
          class="mt-10"
        />
      </div>
    </NScrollbar>
  </div>
</template>

<style lang="scss" scoped>
.notes-list {
  background-color: var(--bg-secondary);
}
</style>