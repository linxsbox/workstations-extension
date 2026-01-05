<script setup>
import { NRadioGroup, NRadio, NSpace } from 'naive-ui'

const props = defineProps({
  value: {
    type: [String, Number],
    default: null,
  },
  options: {
    type: Array,
    required: true,
  }
})

const emit = defineEmits(['update:value'])

const handleChange = (value) => {
  emit('update:value', value)
}
</script>

<template>
  <NRadioGroup :value="value" @update:value="handleChange">
    <NSpace vertical>
      <NRadio
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="setting-radio-option"
      >
        <div class="flex items-start gap-3">
          <!-- 图标（可选） -->
          <component
            v-if="option.icon"
            :is="option.icon"
            class="size-5 mt-0.5 text-gray-600 dark:text-gray-400"
          />

          <div class="flex-1">
            <!-- 选项标签 -->
            <div class="text-sm font-medium">
              {{ option.label }}
            </div>

            <!-- 选项描述（可选） -->
            <div v-if="option.description" class="text-xs text-gray-500 mt-0.5">
              {{ option.description }}
            </div>
          </div>
        </div>
      </NRadio>
    </NSpace>
  </NRadioGroup>
</template>

<style scoped>
.setting-radio-option {
  padding: 8px 0;
}

.setting-radio-option :deep(.n-radio__label) {
  padding-left: 12px;
}
</style>
