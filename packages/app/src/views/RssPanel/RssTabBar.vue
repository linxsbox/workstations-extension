<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { storeRssTabs } from "@/stores/modules/rss/tabs";

const emit = defineEmits(["change"]);

const store = storeRssTabs();
const { getTabs, getActiveTabId } = storeToRefs(store);

// 计算属性：tabs 列表
const tabs = computed(() => getTabs.value);
// 计算属性：当前选中的 tab id
const activeTabId = computed(() => getActiveTabId.value);

// 切换 tab
const handleSwitchTab = (tabId) => {
  store.switchTab(tabId);
  emit("change", tabId);
};
</script>

<template>
  <div class="tab-bar inline-flex justify-center items-center gap-2 p-1 rounded-md">
    <!-- Tab 列表 -->
    <button
      class="tab-item bg-transparent inline-flex px-3 py-1 rounded"
      type="button"
      v-for="tab in tabs"
      :class="{ active: activeTabId === tab.id }"
      :key="tab.id"
      @click="handleSwitchTab(tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.tab-bar {
  background-color: var(--tab-bg-default);

  .tab-item {
    color: var(--interactive-default);
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover {
      color: var(--interactive-hover);
      background-color: var(--tab-bg-hover);
    }

    &:active {
      color: var(--interactive-active);
      background-color: var(--tab-bg-active);
    }

    &.active {
      color: var(--interactive-active);
      background-color: var(--interactive-bg-hover);
    }
  }
}
</style>
