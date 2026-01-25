<script setup>
import { storeToRefs } from "pinia";
import HeaderBarView from "@/components/common/HeaderBar/HeaderBarView.vue";
import { storeAside } from "@/stores/global/aside";

const store = storeAside();
const { getActivePanel } = storeToRefs(store);
</script>

<template>
  <div class="main-panel flex-1 flex flex-col overflow-hidden">
    <div class="flex-none p-4 border-b">
      <HeaderBarView />
    </div>

    <div class="panel-box relative flex-1 overflow-hidden">
      <Transition name="panel-switch" mode="out-in">
        <component :is="store.getPanelComponent(getActivePanel)" />
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-panel {
  background-color: var(--bg-base);
}

.panel-switch-enter-active,
.panel-switch-leave-active {
  transition: all 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s;
}

.panel-switch-leave-to,
.panel-switch-enter-from {
  opacity: 0;
  transform: translateX(15%);
}

.panel-switch-enter-to,
.panel-switch-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
