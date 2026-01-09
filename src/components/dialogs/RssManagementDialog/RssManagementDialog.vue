<script setup>
import { ref, watch, nextTick } from "vue";
import { NModal, NScrollbar, NDivider } from "naive-ui";
import { storeRss } from "@/stores/modules/rss";
import { delay } from "@linxs/toolkit";
import { useScrollNavigation } from "@linxs/toolkit-vue";
import SearchPodcastView from "./components/SearchPodcastView.vue";
import AddFormView from "./components/AddFormView.vue";
import ManagentFormView from "./components/ManagentFormView.vue";

const store = storeRss();

const contentRef = ref(null);
const activeMenus = ref("podcast");
const menus = [
  { id: "podcast", label: "添加播客订阅" },
  { id: "rss", label: "添加订阅源" },
  { id: "management", label: "管理订阅源" },
];

let navigationInstance = null;

const scrollToSection = (menuId) => {
  navigationInstance?.scrollToSection(menuId);
};

const handleScroll = (e) => {
  navigationInstance?.handleScroll(e);
};

// 监听弹窗打开，初始化滚动导航
watch(
  () => store.showAddDialog,
  async (isOpen) => {
    if (isOpen) {
      // 等待 DOM 渲染完成
      await nextTick();
      const nScrollbarWrapper = document.querySelector(
        ".rss-management-scroll"
      );

      if (nScrollbarWrapper) {
        contentRef.value = nScrollbarWrapper;
      }

      navigationInstance = useScrollNavigation(contentRef, {
        menus,
        scrollContainerRef: ".n-scrollbar-container",
        onScroll: (menuId) => {
          activeMenus.value = menuId;
        },
      });
    } else {
      // 对话框关闭时清理导航实例
      navigationInstance = null;
    }
  }
);
</script>

<template>
  <NModal
    v-model:show="store.showAddDialog"
    :mask-closable="false"
    preset="card"
    title="RSS 订阅源管理"
    class="w-[640px]"
  >
    <div class="flex gap-4 h-[40vh]">
      <aside class="flex-none w-32">
        <nav class="aside-nav flex flex-col gap-2">
          <button
            v-for="menu in menus"
            :key="menu.id"
            class="aside-nav-button px-4 py-2 text-left rounded-md bg-transparent"
            :class="{ active: activeMenus === menu.id }"
            @click="scrollToSection(menu.id)"
          >
            {{ menu.label }}
          </button>
        </nav>
      </aside>
      <div class="flex-1">
        <NScrollbar class="rss-management-scroll" @scroll="handleScroll">
          <div id="section-podcast">
            <SearchPodcastView />
          </div>
          <NDivider />
          <div id="section-rss">
            <AddFormView />
          </div>
          <NDivider />
          <div id="section-management">
            <ManagentFormView />
          </div>
        </NScrollbar>
      </div>
    </div>
  </NModal>
</template>

<style lang="scss" scoped>
.aside-nav-button {
  color: var(--interactive-default);
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    color: var(--interactive-hover);
    background-color: var(--interactive-bg-hover);
  }

  &:active {
    color: var(--interactive-active);
    background-color: var(--interactive-bg-active);
  }

  &.active {
    color: var(--interactive-active);
    background-color: var(--interactive-bg-hover);
  }
}
</style>
