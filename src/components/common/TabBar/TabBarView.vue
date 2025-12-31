<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { storeTab } from "@/stores/modules/tab";

const props = defineProps({
  // 当前面板的 key
  panelKey: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["change"]);

const store = storeTab();
// 初始化当前面板的 tabs
store.initializePanelTabs(props.panelKey);

const { getTabs, getActiveTabId } = storeToRefs(store);

// 计算属性：当前面板的 tabs
const tabs = computed(() => getTabs.value(props.panelKey));
// 计算属性：当前选中的 tab id
const activeTabId = computed(() => getActiveTabId.value(props.panelKey));

// 切换 tab
const handleSwitchTab = (tabId) => {
  store.switchTab(props.panelKey, tabId);
  emit("change", tabId);
};
</script>

<template>
  <div class="tab-bar inline-flex justify-center items-center gap-2 p-1 rounded-md">
    <!-- Tab 列表 -->
    <button class="tab-item bg-transparent inline-flex px-3 py-1 rounded" type="button" v-for="tab in tabs"
      :class="{ active: activeTabId === tab.id }" :key="tab.id" @click="handleSwitchTab(tab.id)">
      {{ tab.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.tab-bar {
  background-color: var(--interactive-bg-default);

  .tab-item {
    color: var(--interactive-default);
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover {
      color: var(--interactive-hover);
      background-color: var(--interactive-bg-hover);
    }

    &:hover {
      color: var(--interactive-active);
      background-color: var(--interactive-bg-active);
    }

    &.active {
      color: var(--interactive-active);
      background-color: var(--interactive-bg-hover);
    }
  }
}
</style>
