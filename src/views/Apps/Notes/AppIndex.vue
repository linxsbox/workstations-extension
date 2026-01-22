<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { NModal, useMessage } from "naive-ui";
import { storeApp } from "@/stores/global/app";
import { storeNotes } from "@/stores/miniapps/notes";
import IconAssignment from "@/components/common/Icons/IconAssignment.vue";
import NoteList from "./NoteList.vue";
import NoteEditor from "./NoteEditor.vue";
import ShareCardDialog from "@/components/dialogs/ShareCardDialog/ShareCardDialog.vue";
import { NOTES_CONFIG, SHARE_TYPE } from "./constants";

const message = useMessage();
const appStore = storeApp();
const notesStore = storeNotes();

// UI 状态
const showNoteDialog = ref(false);
const currentNote = ref({ title: "", content: "" });

// 分享内容 DOM 引用
const shareNoteContentRef = ref(null);

// 过滤后的笔记列表（支持搜索）
const filteredNotes = computed(() => notesStore.filteredNotes);

// 当前选中的笔记
const selectedNote = computed(() => notesStore.selectedNote);

// 打开笔记弹窗
const handleOpenNotes = () => {
  showNoteDialog.value = true;
};

// 创建新笔记
const handleCreateNote = () => {
  const newNote = {
    id: Date.now().toString(),
    title: NOTES_CONFIG.defaultTitle,
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notesStore.addNote(newNote);
  notesStore.selectNote(newNote.id);
  currentNote.value = { ...newNote };
};

// 删除笔记
const handleDeleteNote = (noteId) => {
  notesStore.deleteNote(noteId);
  // store 的 deleteNote 已经处理了清除选中状态
  if (notesStore.selectedNoteId === null) {
    currentNote.value = { title: "", content: "" };
  }
  message.success("笔记已删除");
};

// 保存笔记
const handleSaveNote = () => {
  if (!notesStore.selectedNoteId) return;

  notesStore.updateNote(notesStore.selectedNoteId, {
    title: currentNote.value.title || NOTES_CONFIG.untitledPlaceholder,
    content: currentNote.value.content,
  });
};

// 监听分享对话框打开，将内容添加到 DOM
watch(() => notesStore.showShareDialog, async (isOpen) => {
  if (isOpen && notesStore.shareContentElement) {
    await nextTick();
    if (shareNoteContentRef.value) {
      shareNoteContentRef.value.innerHTML = "";
      shareNoteContentRef.value.appendChild(notesStore.shareContentElement);
    }
  }
});

// 监听 store 的 selectedNoteId 变化，更新 currentNote
watch(() => notesStore.selectedNoteId, (noteId) => {
  if (noteId) {
    const note = notesStore.getNoteById(noteId);
    if (note) {
      currentNote.value = { ...note };
    }
  } else {
    currentNote.value = { title: "", content: "" };
  }
});

// 监听 app store 的笔记对话框状态
// 初始化 notes store
notesStore.init();

// 监听 app store 的笔记对话框状态
watch(() => appStore.showNotesDialog, (show) => {
  if (show) {
    handleOpenNotes();
    appStore.closeNotesDialog();
  }
});

// 暴露方法供外部调用
defineExpose({
  handleOpenNotes,
});
</script>

<template>
  <div class="notes-app flex flex-col items-center gap-1">
    <!-- 笔记APP图标 -->
    <button
      class="app-icon"
      :class="{ active: showNoteDialog }"
      @click="handleOpenNotes"
      title="打开笔记"
      aria-label="打开笔记"
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
      content-class="overflow-hidden"
      :mask-closable="false"
      :close-on-esc="false"
      :auto-focus="false"
    >
      <div class="notes-container flex h-full overflow-hidden rounded-lg">
        <!-- 左侧笔记列表 -->
        <NoteList
          :notes="filteredNotes"
          :selected-note-id="notesStore.selectedNoteId"
          @create="handleCreateNote"
        />

        <!-- 右侧笔记编辑器 -->
        <NoteEditor
          :note="selectedNote"
          v-model="currentNote"
          @save="handleSaveNote"
          @create="handleCreateNote"
          @delete="handleDeleteNote"
        />
      </div>
    </NModal>

    <!-- 分享卡片弹窗 -->
    <ShareCardDialog
      v-model:show="notesStore.showShareDialog"
    >
      <div
        ref="shareNoteContentRef"
        class="share-note-content relative min-h-[106px] max-h-[200px] flex flex-col justify-center text-lg overflow-hidden"
        :class="notesStore.shareType === SHARE_TYPE.FULL ? 'share-full-article' : 'share-selected-content'"
      >
      </div>
    </ShareCardDialog>
  </div>
</template>

<style lang="scss" scoped>
.notes-app {
}

.notes-modal {
}

.share-note-content {
  color: rgba(31, 41, 55, 0.45);

  :deep(.text-highlight) {
    color: var(--color-info);
    border-bottom: 1px dashed rgba(var(--color-info-rgb), 0.3);
  }
}

// 选中内容分享样式
.share-selected-content {
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0) 35%,
      rgba(255, 255, 255, 0) 65%,
      rgba(255, 255, 255, 1) 100%
    );
  }
}

// 整篇文章分享样式
.share-full-article {
  justify-content: flex-start !important;
  padding-top: 1rem;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0) 35%,
      rgba(255, 255, 255, 0) 65%,
      rgba(255, 255, 255, 1) 100%
    );
  }

  :deep(.share-title) {
    @apply text-xl font-bold mb-2 truncate;
    color: var(--color-info);
  }

  :deep(.share-content) {
    @apply text-base leading-relaxed line-clamp-3;
    color: rgba(31, 41, 55, 0.65);
  }
}
</style>
