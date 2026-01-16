<script setup>
import { ref, computed } from "vue";
import {
  NModal,
  NInput,
  NScrollbar,
  NButton,
  NEmpty,
  useMessage,
} from "naive-ui";
import { storageManager, WEB_STORAGE_KEYS } from "@/stores/storage";
import IconAssignment from "@/components/common/Icons/IconAssignment.vue";
import IconAssignmentAdd from "@/components/common/Icons/IconAssignmentAdd.vue";
import IconDelete from "@/components/common/Icons/IconDelete.vue";

const message = useMessage();

// 笔记数据
const notes = ref(storageManager.get(WEB_STORAGE_KEYS.NOTES) || []);
const showNoteDialog = ref(false);
const selectedNoteId = ref(null);
const currentNote = ref({ title: "", content: "" });

// 当前选中的笔记
const selectedNote = computed(() => {
  if (!selectedNoteId.value) return null;
  return notes.value.find((n) => n.id === selectedNoteId.value);
});

// 打开笔记弹窗
const handleOpenNotes = () => {
  showNoteDialog.value = true;
};

// 选择笔记
const handleSelectNote = (noteId) => {
  selectedNoteId.value = noteId;
  const note = notes.value.find((n) => n.id === noteId);
  if (note) {
    currentNote.value = { ...note };
  }
};

// 创建新笔记
const handleCreateNote = () => {
  const newNote = {
    id: Date.now().toString(),
    title: "新笔记",
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.value.unshift(newNote);
  saveNotes();
  handleSelectNote(newNote.id);
};

// 删除笔记
const handleDeleteNote = (noteId, event) => {
  event.stopPropagation();
  const index = notes.value.findIndex((n) => n.id === noteId);
  if (index > -1) {
    notes.value.splice(index, 1);
    saveNotes();
    if (selectedNoteId.value === noteId) {
      selectedNoteId.value = null;
      currentNote.value = { title: "", content: "" };
    }
    message.success("笔记已删除");
  }
};

// 保存笔记
const handleSaveNote = () => {
  if (!selectedNoteId.value) return;

  const note = notes.value.find((n) => n.id === selectedNoteId.value);
  if (note) {
    note.title = currentNote.value.title || "无标题";
    note.content = currentNote.value.content;
    note.updatedAt = new Date().toISOString();
    saveNotes();
  }
};

// 保存到存储
const saveNotes = () => {
  storageManager.set(WEB_STORAGE_KEYS.NOTES, notes.value);
};

// 格式化时间
const formatTime = (isoString) => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取首行内容
const getFirstLineContent = (content) => {
  const firstLine = content.split("\n")[0] || "";
  return firstLine.length > 20 ? firstLine.substring(0, 20) + "..." : firstLine;
};
</script>

<template>
  <div class="notes-app flex flex-col items-center gap-1">
    <!-- 笔记APP图标 -->
    <button
      class="app-icon"
      :class="{ active: showNoteDialog }"
      @click="handleOpenNotes"
      title="打开笔记"
    >
      <IconAssignment class="text-2xl" />
    </button>
    <!-- APP标签 -->
    <div class="app-label">笔记</div>

    <!-- 笔记弹窗 -->
    <NModal
      v-model:show="showNoteDialog"
      preset="card"
      title="笔记"
      class="notes-modal w-[95vw] h-[95vh]"
    >
      <div class="notes-container flex h-full gap-3">
        <!-- 左侧笔记列表 -->
        <div class="notes-list flex-none w-80 flex flex-col border-r">
          <div class="p-3 border-b">
            <NButton
              type="primary"
              size="small"
              block
              @click="handleCreateNote"
            >
              <template #icon>
                <IconAssignmentAdd />
              </template>
              新建笔记
            </NButton>
          </div>
          <NScrollbar class="flex-1">
            <div class="p-2">
              <div
                v-for="note in notes"
                :key="note.id"
                class="note-item p-3 mb-2 rounded cursor-pointer transition-all"
                :class="{ active: selectedNoteId === note.id }"
                @click="handleSelectNote(note.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <div class="note-title font-medium text-sm mb-1 truncate">
                      {{ note.title }}
                    </div>
                    <div
                      class="note-preview text-xs text-[var(--text-tertiary)] mb-2"
                    >
                      {{ getFirstLineContent(note.content) || "无内容" }}
                    </div>
                    <div class="note-time text-xs text-[var(--text-tertiary)]">
                      {{ formatTime(note.updatedAt) }}
                    </div>
                  </div>
                  <button
                    class="delete-btn flex-none opacity-0 hover:opacity-100 transition-opacity"
                    @click="handleDeleteNote(note.id, $event)"
                    title="删除"
                  >
                    <IconDelete class="text-base text-red-500" />
                  </button>
                </div>
              </div>

              <NEmpty
                v-if="notes.length === 0"
                description="暂无笔记，双击右侧创建新笔记"
                class="mt-10"
              />
            </div>
          </NScrollbar>
        </div>

        <!-- 右侧笔记内容 -->
        <div class="notes-content flex-1 flex flex-col">
          <div v-if="selectedNoteId" class="flex-1 flex flex-col">
            <div class="p-3 border-b">
              <NInput
                v-model:value="currentNote.title"
                placeholder="笔记标题"
                size="large"
                @blur="handleSaveNote"
              />
            </div>
            <div class="flex-1 p-3">
              <NInput
                v-model:value="currentNote.content"
                type="textarea"
                placeholder="开始记录..."
                :autosize="{ minRows: 20 }"
                @blur="handleSaveNote"
              />
            </div>
          </div>
          <div
            v-else
            class="flex-1 flex items-center justify-center cursor-pointer"
            @dblclick="handleCreateNote"
          >
            <div
              class="flex flex-col justify-center items-center gap-3 text-center text-[var(--text-tertiary)]"
            >
              <IconAssignmentAdd class="text-6xl" />
              <div class="text-base">双击创建新笔记</div>
            </div>
          </div>
        </div>
      </div>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.notes-app {
  .app-icon {
    &.active {
      background-color: rgba(255, 193, 7, 0.15);
      border-color: #ffc107;
      box-shadow: 0 0 8px rgba(255, 193, 7, 0.3);
    }
  }
}

.notes-modal {
  .notes-container {
    height: calc(95vh - 120px);
  }

  .notes-list {
    background-color: var(--bg-secondary);

    .note-item {
      @apply shadow-sm hover:shadow-md;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);

      &:hover {
        background-color: var(--state-hover);

        .delete-btn {
          opacity: 1;
        }
      }

      &.active {
        background-color: var(--interactive-bg-hover);
        border-color: var(--color-primary);
      }

      .delete-btn {
        @apply rounded transition-opacity;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;

        &:hover {
          background-color: rgba(255, 0, 0, 0.1);
        }
      }
    }
  }

  .notes-content {
    background-color: var(--bg-primary);
  }
}
</style>
