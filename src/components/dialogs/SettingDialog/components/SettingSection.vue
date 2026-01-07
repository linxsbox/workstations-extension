<script setup>
import SettingItem from './SettingItem.vue'

const props = defineProps({
  section: {
    type: Object,
    required: true,
  }
})
</script>

<template>
  <div class="setting-section">
    <!-- 渲染该 section 下的所有设置项 -->
    <SettingItem
      v-for="item in section.sections"
      :key="item.id"
      :config="item"
      class="setting-section-item"
    />
  </div>
</template>

<style scoped>
.setting-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-section-item {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.setting-section-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
</style>
