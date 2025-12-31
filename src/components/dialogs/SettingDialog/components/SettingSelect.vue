<script setup>
import { NSelect } from 'naive-ui'

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
  <div class="setting-select-wrapper">
    <NSelect
      :value="value"
      :options="options"
      @update:value="handleChange"
      class="setting-select"
    />
  </div>
</template>

<style scoped>
.setting-select-wrapper {
  max-width: 300px;
}

.setting-select {
  width: 100%;
}
</style>
