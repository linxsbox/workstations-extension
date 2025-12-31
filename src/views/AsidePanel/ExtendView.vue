<script setup>
import IconRss from "@/components/common/Icons/IconRss.vue";
import { storeRss } from "@/stores/modules/rss";

const store = storeRss();

const handleRssManageClick = () => {
  store.openAddDialog();
};
</script>

<template>
  <div class="extend-box flex flex-col gap-3">
    <button
      class="extend-button bg-transparent inline-flex justify-center items-center gap-2 py-2 px-4 border rounded-md"
      type="button"
      @click="handleRssManageClick"
    >
      <div class="extend-icon"><IconRss class="text-base" /></div>
      <span class="extend-label">订阅源管理</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.extend-button {
  color: var(--text-primary);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--interactive-bg-hover-1);
  }

  &:active {
    background-color: var(--interactive-bg-active-1);
  }

  &.active {
    background-color: var(--interactive-bg-hover-1);
  }
}
</style>
