<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { NModal, useMessage } from "naive-ui";
import { storageManager, WEB_STORAGE_KEYS } from "@/stores/storage";
import IconAssignment from "@/components/common/Icons/IconAssignment.vue";
import NoteList from "./NoteList.vue";
import NoteEditor from "./NoteEditor.vue";
import ShareCardDialog from "@/components/dialogs/ShareCardDialog/ShareCardDialog.vue";
import { NOTES_CONFIG, SHARE_CARD_CONFIG, SHARE_TYPE } from "./constants";

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
const shareNoteContentRef = ref(null); // 分享内容元素引用
const shareContentElement = ref(null); // 待渲染的内容元素
const shareType = ref(""); // 分享类型：'full' 整篇文章, 'selected' 选中内容

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

// 从编辑器分享笔记（检查是否选中内容）
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

// 格式化整篇文章
const formatFullArticle = (note) => {
  const title = note.title || "";
  const content = note.content || "";

  // 获取第一个换行符之前的内容
  const firstLineBreak = content.indexOf("\n");
  const contentText = firstLineBreak > -1
    ? content.substring(0, firstLineBreak)
    : content;

  // 创建内容容器
  const contentDiv = document.createElement("div");

  // 添加标题
  if (title) {
    const titleDiv = document.createElement("div");
    titleDiv.className = "share-title";
    titleDiv.textContent = title;
    contentDiv.appendChild(titleDiv);
  }

  // 添加内容
  const contentTextDiv = document.createElement("div");
  contentTextDiv.className = "share-content";
  contentTextDiv.textContent = formatTextForShare(contentText);
  contentDiv.appendChild(contentTextDiv);

  // 保存到变量，等待 modal 打开后渲染
  shareContentElement.value = contentDiv;
  shareType.value = SHARE_TYPE.FULL; // 设置分享类型为整篇文章

  return "";
};

// 格式化文本：处理换行符
const formatTextForShare = (text) => {
  return text
    .replace(/\r/g, "") // 移除所有 \r
    .replace(/\n+/g, " "); // 将一个或多个 \n 替换为一个空格
};

// 创建测量元素
const createMeasureElement = () => {
  const element = document.createElement("div");
  element.style.position = "absolute";
  element.style.visibility = "hidden";
  element.style.whiteSpace = "nowrap";
  element.style.fontSize = "18px"; // 与分享卡片的字体大小一致
  element.style.lineHeight = "1.5";
  element.style.height = "0px"
  element.style.overflow = "hidden"
  document.body.appendChild(element);
  return element;
};

// 测量文本宽度
const measureTextWidth = (text, measureElement) => {
  measureElement.textContent = text;
  return measureElement.offsetWidth;
};

// 格式化选中内容
const formatSelectedContent = (note, selectedText) => {
  if (!selectedText) return "";

  const content = note.content || "";
  const selectedIndex = content.indexOf(selectedText);

  // 如果找不到选中内容，直接返回选中文本
  if (selectedIndex === -1) {
    return selectedText;
  }

  // 创建测量元素
  const measureElement = createMeasureElement();

  try {
    // 测量选中内容的宽度
    const selectedWidth = measureTextWidth(selectedText, measureElement);

    // 计算前后需要的宽度（平均分配剩余空间）
    const remainingWidth = SHARE_CARD_CONFIG.targetTotalWidth - selectedWidth;
    const beforeWidth = remainingWidth / 2;
    const afterWidth = remainingWidth / 2;

    // 获取前文和后文
    const beforeText = content.substring(0, selectedIndex);
    const afterText = content.substring(selectedIndex + selectedText.length);

    // 从后向前取前文字符，直到达到目标宽度
    let beforeResult = "";
    for (let i = beforeText.length - 1; i >= 0; i--) {
      const testText = beforeText[i] + beforeResult;
      const testWidth = measureTextWidth(testText, measureElement);

      if (testWidth > beforeWidth) break;

      beforeResult = testText;
    }

    // 从前向后取后文字符，直到达到目标宽度
    let afterResult = "";
    for (let i = 0; i < afterText.length; i++) {
      const testText = afterResult + afterText[i];
      const testWidth = measureTextWidth(testText, measureElement);

      if (testWidth > afterWidth) break;

      afterResult = testText;
    }

    // 创建内容 div
    const contentDiv = document.createElement("div");

    // 添加前文（去除换行符）
    if (beforeResult) {
      const beforeSpan = document.createTextNode(
        formatTextForShare(beforeResult)
      );
      contentDiv.appendChild(beforeSpan);
    }

    // 添加选中内容（高亮显示）
    const selectedSpan = document.createElement("span");
    selectedSpan.textContent = formatTextForShare(selectedText);
    selectedSpan.classList.add('text-highlight')
    contentDiv.appendChild(selectedSpan);

    // 添加后文（去除换行符）
    if (afterResult) {
      const afterSpan = document.createTextNode(formatTextForShare(afterResult));
      contentDiv.appendChild(afterSpan);
    }

    // 保存到变量，等待 modal 打开后渲染
    shareContentElement.value = contentDiv;
    shareType.value = SHARE_TYPE.SELECTED; // 设置分享类型为选中内容

    return ""; // 返回空字符串，因为内容会在 modal 打开后添加到 DOM
  } finally {
    // 清理测量元素
    document.body.removeChild(measureElement);
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

// 监听分享对话框打开，将内容添加到 DOM
watch(showShareDialog, async (isOpen) => {
  if (isOpen && shareContentElement.value) {
    await nextTick();
    if (shareNoteContentRef.value) {
      shareNoteContentRef.value.innerHTML = "";
      shareNoteContentRef.value.appendChild(shareContentElement.value);
    }
  }
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
    <!-- :qrcodeContent="`https://example.com/note/${shareNoteId}`" -->
    <ShareCardDialog
      v-model:show="showShareDialog"
    >
      <div
        ref="shareNoteContentRef"
        class="share-note-content relative min-h-[106px] max-h-[200px] flex flex-col justify-center text-lg overflow-hidden"
        :class="shareType === SHARE_TYPE.FULL ? 'share-full-article' : 'share-selected-content'"
      >
      </div>
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
      <div class="text-sm text-gray-600">当前选中了内容，您需要如何分享？</div>
      <div class="mt-3 text-xs text-gray-500">
        <div>• 分享文章：以文章格式进行分享</div>
        <div>• 分享选中内容：分享选中的内容</div>
      </div>
    </NModal>
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
