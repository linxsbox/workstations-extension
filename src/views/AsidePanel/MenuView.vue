<script setup>
import { storeToRefs } from "pinia";
import { storeAside } from "@/stores/global/aside";

const store = storeAside();
const { getMenuItems, getActiveMenuId } = storeToRefs(store);

const handleSwitchMenuItem = (panel) => {
  store.switchPanel(panel);
};
</script>

<template>
  <div class="menu-box flex flex-col gap-3">
    <button
      class="aside-menu-button inline-flex items-center gap-2 py-2 px-4 cursor-pointer rounded-md"
      v-for="item in getMenuItems"
      :class="{ active: getActiveMenuId === item.id }"
      :key="item.id"
      type="button"
      @click="handleSwitchMenuItem(item.panel)"
    >
      <component class="menu-icon text-base" :is="item.icon" />
      <div class="menu-label">{{ item.label }}</div>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.aside-menu-button {
  color: var(--text-primary);
  background-color: transparent;
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
