<script setup>
import { NModal, NScrollbar, NDivider } from "naive-ui";
import { storeSettings } from "@/stores/storeSettings";
import { settingMenus } from "@/stores/storeSettings/config";
import GeneralSection from "./components/GeneralSection.vue";
import NotificationSection from "./components/NotificationSection.vue";
import AdvancedSection from "./components/AdvancedSection.vue";
import { useScrollNavigation } from "@linxs/toolkit-vue";

const store = storeSettings();
const { showSettingDialog, activeSettingSection } = storeToRefs(store);

const contentRef = ref(null);

const {
  scrollToSection, // 滚动到指定部分
  calculateSectionPositions, // 计算各个部分的位置
  handleScroll, // 处理滚动事件
} = useScrollNavigation(contentRef, settingMenus, (menuId) => {
  store.switchSettingSection(menuId);
});

onMounted(() => {
  calculateSectionPositions();
  window.addEventListener("resize", calculateSectionPositions);
});

// 监听对话框打开
watch(showSettingDialog, (isShow) => {
  if (isShow && contentRef.value) {
    nextTick(() => {
      calculateSectionPositions();
      const position =
        sectionPositions.value[activeSettingSection.value]?.top || 0;
      contentRef.value.scrollTo({ top: position });
    });
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
    class="w-[80vw] max-w-[1200px]"
  >
    <div class="flex gap-4 h-[70vh]">
      <!-- 左侧导航 -->
      <aside class="flex-none w-48">
        <NScrollbar>
          <nav class="aside-nav flex flex-col gap-2">
            <button
              v-for="menu in settingMenus"
              :key="menu.id"
              class="aside-nav-button px-4 py-2 text-left rounded-md bg-transparent"
              :class="{ active: activeSettingSection === menu.id }"
              @click="scrollToSection(menu.id)"
            >
              {{ menu.label }}
            </button>
          </nav>
        </NScrollbar>
      </aside>

      <!-- 右侧内容 -->
      <div class="flex-1">
        <NScrollbar ref="contentRef" @scroll="handleScroll">
          <div class="setting-content pr-4">
            <div id="section-general" class="setting-section mb-8">
              <GeneralSection />
            </div>
            <NDivider />
            <div id="section-notification" class="setting-section mb-8">
              <NotificationSection />
            </div>
            <NDivider />
            <div id="section-advanced">
              <AdvancedSection />
            </div>
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
