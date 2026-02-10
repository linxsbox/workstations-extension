<script setup>
import { inject, ref } from 'vue';
import { NRadioGroup, NRadio, NRadioButton, NCheckbox, NInput } from 'naive-ui';
import { DEFAULT_CARD_CONTROL_STATE } from '@/composables/shareCard/useControlPanel';

const props = defineProps({});

const emit = defineEmits([]);

// 注入共享的卡片控制状态（提供默认值）
const cardControlState = inject('cardControlState', DEFAULT_CARD_CONTROL_STATE);

// 注入加载状态
const isLoading = inject('isLoading', ref(false));
</script>

<template>
  <div
    class="share-control-panel flex flex-col gap-3 w-full p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]"
  >
    <!-- 第一行：卡片尺寸切换 -->
    <!-- <div class="flex items-center gap-3 flex-wrap">
      <span class="text-sm text-[var(--text-secondary)] flex-shrink-0">
        卡片类型:
      </span>
      <NRadioGroup v-model:value="currentSize" size="small">
        <NRadio v-for="size in availableSizes" :key="size" :value="size">
          {{ getSizeLabel(size) }}
        </NRadio>
      </NRadioGroup>
    </div> -->

    <NInput
      v-model:value="cardControlState.signature"
      placeholder="输入签名（最多20字）"
      maxlength="20"
      show-count
      :disabled="isLoading"
    />

    <div class="flex items-center gap-3">
      <NRadioGroup
        v-model:value="cardControlState.textAlign"
        size="small"
        :disabled="isLoading"
      >
        <NRadioButton value="left">左</NRadioButton>
        <NRadioButton value="center">中</NRadioButton>
        <NRadioButton value="right">右</NRadioButton>
      </NRadioGroup>
      <NCheckbox
        v-model:checked="cardControlState.isSignatureShow"
        :disabled="isLoading"
      >
        显示签名
      </NCheckbox>
      <NCheckbox
        v-model:checked="cardControlState.isQrcodeShow"
        :disabled="isLoading"
      >
        显示二维码
      </NCheckbox>
    </div>

    <!-- 自定义控制项插槽 -->
    <slot name="custom-controls"></slot>
  </div>
</template>

<style lang="scss" scoped>
.share-control-panel {
}
</style>
