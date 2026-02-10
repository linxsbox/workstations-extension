<script setup>
import { provide, reactive, ref } from 'vue';
import { NButton, NModal, useMessage } from 'naive-ui';
import { clipboard } from '@linxs/toolkit';
import { useCardExport } from '@/composables/shareCard/useCardExport';
import { createCardControlState } from '@/composables/shareCard/useControlPanel';
import ControlView from './components/Panels/ControlView.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  shareLink: {
    type: String,
    default: '',
  },
  showShareLink: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:show', 'close']);

const message = useMessage();
const { copyCardAsImage } = useCardExport();

// 提供共享的卡片控制状态
const cardControlState = reactive(createCardControlState());

// 提供给子组件
provide('cardControlState', cardControlState);

// 操作加载状态
const isLoading = ref(false);

// 提供加载状态给子组件
provide('isLoading', isLoading);

// 关闭对话框
const handleClose = () => {
  emit('update:show', false);
  emit('close');
};

// 复制卡片
const handleCopyCard = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    await copyCardAsImage('.share-card-content');
    message.success('已复制到剪贴板');
  } catch (error) {
    message.error(`复制失败: ${error.message || '未知错误'}`);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 200);
  }
};

// 分享链接
const handleShareLink = async () => {
  if (isLoading.value) return;

  if (!props.shareLink) {
    message.warning('没有可分享的链接');
    return;
  }

  isLoading.value = true;
  try {
    await clipboard({
      type: 'text',
      data: props.shareLink,
      success: () => {
        message.success('链接已复制到剪贴板');
      },
      error: (msg) => {
        message.error(`复制失败: ${msg}`);
      },
    });
    emit('share-link', props.shareLink);
  } catch (error) {
    message.error(`复制失败: ${error.message || '未知错误'}`);
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 200);
  }
};
</script>

<template>
  <NModal
    :show="show"
    @update:show="(value) => emit('update:show', value)"
    :bordered="false"
    :closable="false"
    :mask-closable="true"
    transform-origin="center"
    class="share-card-modal"
  >
    <div class="flex flex-col items-center gap-5 p-5">
      <!-- 卡片内容区域（完全由子组件控制） -->
      <div class="share-card-content">
        <slot></slot>
      </div>

      <ControlView />

      <!-- 底部操作按钮 -->
      <div class="flex gap-3 justify-end">
        <NButton
          v-if="showShareLink"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleShareLink"
        >
          分享链接
        </NButton>
        <NButton
          type="primary"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleCopyCard"
        >
          分享卡片
        </NButton>
        <NButton :disabled="isLoading" @click="handleClose"> 关闭 </NButton>
      </div>
    </div>
  </NModal>
</template>

<style lang="scss" scoped>
:deep(.n-modal) {
  background: transparent;
  box-shadow: none;
  max-width: 90vw;
}
</style>
