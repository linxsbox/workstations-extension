<script setup>
import { ref, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { NModal, NScrollbar, NDivider } from "naive-ui";
import { storeSettings } from "@/stores/modules/settings";
import { settingSchema } from "@/stores/modules/settings/config";
import SettingSection from "./components/SettingSection.vue";
import { useScrollNavigation } from "@linxs/toolkit-vue";

const store = storeSettings();
const { showSettingDialog, activeSettingSection } = storeToRefs(store);

const contentRef = ref(null);

let navigationInstance = null;

const scrollToSection = (menuId) => {
  navigationInstance?.scrollToSection(menuId);
};

const handleScroll = (e) => {
  navigationInstance?.handleScroll(e);
};

// 监听弹窗打开，初始化滚动导航
watch(showSettingDialog, async (isOpen) => {
  if (isOpen && !navigationInstance) {
    // 等待 DOM 渲染完成
    await nextTick();

    const nScrollbarWrapper = document.querySelector(".setting-content-scroll");

    if (nScrollbarWrapper) {
      contentRef.value = nScrollbarWrapper;
    }

    navigationInstance = useScrollNavigation(contentRef, {
      menus: settingSchema,
      scrollContainerRef: ".n-scrollbar-container",
      onScroll: (menuId) => {
        store.switchSettingSection(menuId);
      },
    });
  }

  // 弹窗打开时，滚动到当前激活的 section
  if (isOpen && navigationInstance && contentRef.value) {
    await nextTick();
    navigationInstance.calculateSectionPositions();
    const position = navigationInstance.sectionPositions.value[activeSettingSection.value]?.top || 0;
    contentRef.value.scrollTo({ top: position });
  }
});
</script>

<template>
  <NModal
    v-model:show="showSettingDialog"
    @update:show="store.closeSetting"
    :mask-closable="false"
    transform-origin="center"
    preset="card"
    title="设置"
    class="w-[80vw] max-w-[980px]"
  >
    <div class="flex gap-4 h-[70vh]">
      <!-- 左侧导航 -->
      <aside class="flex-none w-48">
        <NScrollbar>
          <nav class="aside-nav flex flex-col gap-2">
            <button
              v-for="section in settingSchema"
              :key="section.id"
              class="aside-nav-button px-4 py-2 text-left rounded-md bg-transparent"
              :class="{ active: activeSettingSection === section.id }"
              @click="scrollToSection(section.id)"
            >
              {{ section.label }}
            </button>
          </nav>
        </NScrollbar>
      </aside>

      <!-- 右侧内容 -->
      <div class="flex-1">
        <NScrollbar class="setting-content-scroll" @scroll="handleScroll">
          <div class="setting-content pr-4">
            <template v-for="(section, index) in settingSchema" :key="section.id">
              <div :id="`section-${section.id}`" class="setting-section mb-8">
                <SettingSection :section="section" />
              </div>
              <NDivider v-if="index < settingSchema.length - 1" />
            </template>
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
