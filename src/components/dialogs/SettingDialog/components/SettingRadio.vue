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
    <div class="inline-flex flex-wrap gap-4">
      <NRadio
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="setting-radio-option items-center"
      >
        <div class="inline-flex items-center gap-2">
          <!-- 图标（可选） -->
          <component
            v-if="option.icon"
            :is="option.icon"
            class="text-xl"
          />

          <!-- 选项内容 -->
          <div class="flex flex-col">
            <!-- 选项标签 -->
            <span class="text-sm font-medium">
              {{ option.label }}
            </span>

            <!-- 选项描述（可选） -->
            <span v-if="option.description" class="text-xs text-[var(--text-secondary)]">
              {{ option.description }}
            </span>
          </div>
        </div>
      </NRadio>
    </div>
  </NRadioGroup>
</template>

<style scoped></style>
