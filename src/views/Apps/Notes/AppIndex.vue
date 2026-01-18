<script setup>
import { ref, computed } from "vue";
import { NModal, useMessage } from "naive-ui";
import { storageManager, WEB_STORAGE_KEYS } from "@/stores/storage";
import IconAssignment from "@/components/common/Icons/IconAssignment.vue";
import NoteList from "./NoteList.vue";
import NoteEditor from "./NoteEditor.vue";
import ShareCardDialog from "@/components/dialogs/ShareCardDialog/ShareCardDialog.vue";
import { NOTES_CONFIG } from "./constants";

const message = useMessage();

// 笔记数据
const notes = ref(storageManager.get(WEB_STORAGE_KEYS.NOTES) || []);
const showNoteDialog = ref(false);
const selectedNoteId = ref(null);
const currentNote = ref({ title: "", content: "" });
const searchKeyword = ref("");

// 分享相关状态
const showShareDialog = ref(false);
const shareContent = ref("");
const shareNoteId = ref(null);

// 分享确认对话框状态
const showShareConfirmDialog = ref(false);
const pendingShareNote = ref(null);
const pendingSelectedText = ref("");

// 按更新时间排序的笔记列表
const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => {
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
});

// 过滤后的笔记列表（支持搜索）
const filteredNotes = computed(() => {
  if (!searchKeyword.value.trim()) {
    return sortedNotes.value;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return sortedNotes.value.filter((note) => {
    return (
      note.title.toLowerCase().includes(keyword) ||
      note.content.toLowerCase().includes(keyword)
    );
  });
});

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
    title: NOTES_CONFIG.defaultTitle,
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.value.unshift(newNote);
  saveNotes();
  handleSelectNote(newNote.id);
};

// 删除笔记
const handleDeleteNote = (noteId) => {
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
    note.title = currentNote.value.title || NOTES_CONFIG.untitledPlaceholder;
    note.content = currentNote.value.content;
    note.updatedAt = new Date().toISOString();
    saveNotes();
  }
};

// 保存到存储
const saveNotes = () => {
  storageManager.set(WEB_STORAGE_KEYS.NOTES, notes.value);
};

// 从编辑器分享笔记（检测选中内容）
const handleShareNote = (noteId) => {
  const note = notes.value.find((n) => n.id === noteId);
  if (!note) return;

  // 获取选中的文本
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || "";

  if (selectedText) {
    // 有选中内容，弹出确认对话框
    openShareConfirmDialog(note, selectedText);
  } else {
    // 无选中内容，直接分享整篇文章
    shareFullArticle(note);
  }
};

// 从列表分享笔记（直接分享整篇）
const handleShareFromList = (noteId) => {
  const note = notes.value.find((n) => n.id === noteId);
  if (!note) return;
  shareFullArticle(note);
};

// 显示分享确认对话框
const openShareConfirmDialog = (note, selectedText) => {
  pendingShareNote.value = note;
  pendingSelectedText.value = selectedText;
  showShareConfirmDialog.value = true;
};

// 处理分享文章
const handleShareFullArticle = () => {
  if (pendingShareNote.value) {
    shareFullArticle(pendingShareNote.value);
    showShareConfirmDialog.value = false;
  }
};

// 处理分享选中内容
const handleShareSelectedContent = () => {
  if (pendingShareNote.value && pendingSelectedText.value) {
    shareSelectedContent(pendingShareNote.value, pendingSelectedText.value);
    showShareConfirmDialog.value = false;
  }
};

// 分享整篇文章
const shareFullArticle = (note) => {
  const content = formatFullArticle(note);
  shareContent.value = content;
  shareNoteId.value = note.id;
  showShareDialog.value = true;
};

// 分享选中内容
const shareSelectedContent = (note, selectedText) => {
  const content = formatSelectedContent(note, selectedText);
  shareContent.value = content;
  shareNoteId.value = note.id;
  showShareDialog.value = true;
};

// 格式化整篇文章（约6行，全部高亮+虚线）
const formatFullArticle = (note) => {
  const title = note.title || NOTES_CONFIG.untitledPlaceholder;
  const content = note.content || "";
  const fullText = `${title}\n\n${content}`;

  // 取前约6行
  const lines = fullText.split('\n').slice(0, 6);
  return `<div class="share-highlight">${lines.join('<br>')}</div>`;
};

// 格式化选中内容（选中高亮+虚线，前后上下文浅灰色，总共约6行）
const formatSelectedContent = (note, selectedText) => {
  const fullContent = note.content || "";
  const selectedIndex = fullContent.indexOf(selectedText);

  if (selectedIndex === -1) {
    // 找不到选中内容，降级为分享整篇
    return formatFullArticle(note);
  }

  // 计算前后上下文
  const before = fullContent.substring(0, selectedIndex);
  const after = fullContent.substring(selectedIndex + selectedText.length);

  // 分割成行
  const beforeLines = before.split('\n').filter(l => l.trim());
  const selectedLines = selectedText.split('\n');
  const afterLines = after.split('\n').filter(l => l.trim());

  // 计算需要的前后行数（总共约6行）
  const selectedLineCount = selectedLines.length;
  const remainingLines = 6 - selectedLineCount;
  const beforeCount = Math.floor(remainingLines / 2);
  const afterCount = remainingLines - beforeCount;

  // 提取前后上下文
  const contextBefore = beforeLines.slice(-beforeCount);
  const contextAfter = afterLines.slice(0, afterCount);

  // 构建HTML
  let html = '';

  // 前文（浅灰色）
  if (contextBefore.length > 0) {
    html += `<div class="share-context">${contextBefore.join('<br>')}</div>`;
  }

  // 选中内容（高亮+虚线）
  html += `<div class="share-highlight">${selectedLines.join('<br>')}</div>`;

  // 后文（浅灰色）
  if (contextAfter.length > 0) {
    html += `<div class="share-context">${contextAfter.join('<br>')}</div>`;
  }

  return html;
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
      :mask-closable="false"
      :close-on-esc="false"
      :auto-focus="false"
    >
      <div class="notes-container flex h-full overflow-hidden rounded-lg">
        <!-- 左侧笔记列表 -->
        <NoteList
          :notes="filteredNotes"
          :selected-note-id="selectedNoteId"
          v-model:search-keyword="searchKeyword"
          @create="handleCreateNote"
          @select="handleSelectNote"
          @delete="handleDeleteNote"
          @share="handleShareFromList"
        />

        <!-- 右侧笔记编辑器 -->
        <NoteEditor
          :note="selectedNote"
          v-model="currentNote"
          @save="handleSaveNote"
          @create="handleCreateNote"
          @delete="handleDeleteNote"
          @share="handleShareNote"
        />
      </div>
    </NModal>

    <!-- 分享卡片弹窗 -->
    <ShareCardDialog
      v-model:show="showShareDialog"
      :qrcodeContent="`https://example.com/note/${shareNoteId}`"
      :qrcodeSize="80"
    >
      <div v-html="shareContent"></div>
    </ShareCardDialog>

    <!-- 分享确认对话框 -->
    <NModal
      v-model:show="showShareConfirmDialog"
      preset="dialog"
      title="选择分享内容"
      :positive-text="'分享文章'"
      :negative-text="'分享选中内容'"
      :auto-focus="false"
      @positive-click="handleShareFullArticle"
      @negative-click="handleShareSelectedContent"
    >
      <div class="text-sm text-gray-600">
        检测到您选中了部分内容，请选择分享方式：
      </div>
      <div class="mt-3 text-xs text-gray-500">
        <div>• 分享文章：分享完整的标题和内容（约6行）</div>
        <div>• 分享选中内容：仅分享选中部分及上下文（约6行）</div>
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
}

// 分享内容样式
:deep(.share-highlight) {
  color: #000;
  font-weight: 500;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
  padding-bottom: 2px;
  margin-bottom: 8px;
}

:deep(.share-context) {
  color: #999;
  margin-bottom: 8px;
}
</style>
