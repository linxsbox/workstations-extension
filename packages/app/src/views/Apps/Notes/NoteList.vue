<script setup>
import { NScrollbar, NButton, NEmpty, NInput } from 'naive-ui';
import IconAssignmentAdd from '@/components/common/Icons/IconAssignmentAdd.vue';
import NoteCard from './NoteCard.vue';
import { storeNotes } from '@/stores/miniapps/notes';

const props = defineProps({
  notes: {
    type: Array,
    required: true,
  },
  selectedNoteId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['create']);

const notesStore = storeNotes();

const handleCreate = () => {
  emit('create');
};
</script>

<template>
  <div class="notes-list flex-none w-80 flex flex-col border-r">
    <div class="p-3 border-b space-y-2">
      <NInput
        v-model:value="notesStore.searchKeyword"
        placeholder="搜索笔记..."
        size="small"
        clearable
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
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :is-active="selectedNoteId === note.id"
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