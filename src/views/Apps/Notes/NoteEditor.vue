<script setup>
import { computed, ref } from 'vue';
import { NButton, NPopconfirm, NModal } from 'naive-ui';
import IconAssignmentAdd from '@/components/common/Icons/IconAssignmentAdd.vue';
import IconShare from '@/components/common/Icons/IconShare.vue';
import IconDelete from '@/components/common/Icons/IconDelete.vue';
import { timeBefore } from '@/utils/time';
import { storeNotes } from '@/stores/miniapps/notes';
import { SHARE_CARD_CONFIG } from './constants';

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

const emit = defineEmits(['update:modelValue', 'save', 'create', 'delete']);

const notesStore = storeNotes();

// 分享确认对话框状态
const showShareConfirmDialog = ref(false);
const pendingSelectedText = ref("");

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
  element.style.fontSize = "18px";
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

    // 移除测量元素
    document.body.removeChild(measureElement);

    // 创建内容容器
    const contentDiv = document.createElement("div");

    // 添加前文（如果有）
    if (beforeResult) {
      const beforeSpan = document.createElement("span");
      beforeSpan.className = "share-before";
      beforeSpan.textContent = formatTextForShare(beforeResult);
      contentDiv.appendChild(beforeSpan);
    }

    // 添加选中内容
    const selectedSpan = document.createElement("span");
    selectedSpan.className = "share-selected";
    selectedSpan.textContent = formatTextForShare(selectedText);
    contentDiv.appendChild(selectedSpan);

    // 添加后文（如果有）
    if (afterResult) {
      const afterSpan = document.createElement("span");
      afterSpan.className = "share-after";
      afterSpan.textContent = formatTextForShare(afterResult);
      contentDiv.appendChild(afterSpan);
    }

    return contentDiv;
  } catch (error) {
    // 如果出错，移除测量元素并返回选中文本
    if (measureElement.parentNode) {
      document.body.removeChild(measureElement);
    }
    return selectedText;
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

  return contentDiv;
};

// 分享整篇文章
const shareFullArticle = (note) => {
  const contentElement = formatFullArticle(note);
  notesStore.openShareDialog(note.id, contentElement, 'full');
};

// 分享选中内容
const shareSelectedContent = (note, selectedText) => {
  const contentElement = formatSelectedContent(note, selectedText);
  notesStore.openShareDialog(note.id, contentElement, 'selected');
};

// 处理分享按钮点击
const handleShare = () => {
  if (!props.note?.id) return;

  // 获取选中的文本
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || "";

  if (selectedText) {
    // 有选中内容，弹出确认对话框
    pendingSelectedText.value = selectedText;
    showShareConfirmDialog.value = true;
  } else {
    // 无选中内容，直接分享整篇文章
    shareFullArticle(props.note);
  }
};

// 处理分享文章
const handleShareFullArticle = () => {
  if (props.note) {
    shareFullArticle(props.note);
    showShareConfirmDialog.value = false;
  }
};

// 处理分享选中内容
const handleShareSelectedContent = () => {
  if (props.note && pendingSelectedText.value) {
    shareSelectedContent(props.note, pendingSelectedText.value);
    showShareConfirmDialog.value = false;
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
              <IconShare class="hover:text-[var(--color-info)]" />
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
                  <IconDelete class="hover:text-[var(--color-error)]" />
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

