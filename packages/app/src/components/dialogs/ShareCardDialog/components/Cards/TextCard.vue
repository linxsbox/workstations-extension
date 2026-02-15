<script setup>
import { inject, ref, computed } from 'vue';
import UseageView from '../Panels/UseageView.vue';
import { DEFAULT_CARD_CONTROL_STATE } from '@/composables/shareCard/useControlPanel';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  backgroundColor: {
    type: String,
    default: '#ffffff',
  },
});

const emit = defineEmits(['update:content']);

// 注入共享的卡片控制状态（提供默认值）
const cardControlState = inject('cardControlState', DEFAULT_CARD_CONTROL_STATE);

// 本地内容状态
const textContent = ref(props.content || '在此输入文本内容...');

// 背景样式
const backgroundStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
}));

// 文本样式
const textStyle = computed(() => ({
  textAlign: cardControlState.textAlign || 'left',
}));

// 处理内容变化
const handleContentChange = (event) => {
  const newContent = event.target.innerText;
  textContent.value = newContent;
  emit('update:content', newContent);
};
</script>

<template>
  <div
    class="text-card-wrapper relative flex flex-col gap-4 w-[402px] h-[524px] overflow-hidden rounded-2xl"
  >
    <!-- 背景层 -->
    <div
      class="background-layer absolute inset-0 z-[1]"
      :style="backgroundStyle"
    ></div>

    <!-- 卡片内容 -->
    <div
      class="content-layer relative z-10 flex-1 flex flex-col justify-between gap-4 px-9 pt-14 pb-6 h-full"
    >
      <!-- 文本内容区域 -->
      <div
        class="text-section flex-1 flex items-start overflow-y-auto"
        :style="textStyle"
      >
        <div
          class="text-content text-base leading-relaxed text-gray-800 whitespace-pre-wrap outline-none w-full"
          contenteditable="true"
          @input="handleContentChange"
          v-text="textContent"
        ></div>
      </div>

      <!-- 交互面板 -->
      <UseageView />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.text-card-wrapper {
  // 背景层样式
  .background-layer {
    transition: background-color 0.3s ease;
  }

  .content-layer {
    .text-section {
      // 自定义滚动条
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      .text-content {
        min-height: 100%;

        &:focus {
          outline: none;
        }

        &:empty::before {
          content: attr(placeholder);
          color: rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}
</style>
