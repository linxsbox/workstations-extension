<script setup>
import { NSwitch } from 'naive-ui'

const props = defineProps({
  value: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['update:value'])

const handleChange = (value) => {
  emit('update:value', value)
}
</script>

<template>
  <div class="setting-switch-wrapper">
    <NSwitch :value="value" @update:value="handleChange" />
  </div>
</template>

<style scoped>
.setting-switch-wrapper {
  display: flex;
  align-items: center;
}
</style>
