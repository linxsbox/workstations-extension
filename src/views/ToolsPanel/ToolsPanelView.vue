<script setup>
import { NDrawer, NDrawerContent, NButton, NScrollbar } from "naive-ui";
import TabBarView from "@/components/TabBar/TabBarView.vue";
import IconClose from "@/components/Icons/IconClose.vue";
import { toolsList } from "./config.js";

const showDetailPanel = ref(false);
const currentActiveTool = ref(null);

// 触发打开支持的工具详情
const handleOpenToolsDetail = () => {
  showDetailPanel.value = true;
};
// 触发关闭
const handleCloseToolsDetail = () => {
  showDetailPanel.value = false;
};
// 按 Esc 关闭
const handleEscEvent = () => {
  handleCloseToolsDetail();
};

const handleClickToolApp = (item) => {
  handleOpenToolsDetail();
  currentActiveTool.value = item;
};
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex-none px-4 py-2 border-b">
      <TabBarView panelKey="tools" />
    </div>

    <NScrollbar
      class="flex-1 p-4"
      content-class="flex flex-wrap h-[inherit] gap-3"
    >
      <div
        class="tool-app inline-flex gap-1 items-center w-[150px] h-[40px] p-2 rounded-md cursor-pointer"
        v-for="tool in toolsList"
        :key="tool.name"
        @click="handleClickToolApp(tool)"
      >
        <component :is="tool.icon" class="text-2xl" />
        {{ tool.name }}
      </div>
    </NScrollbar>

    <NDrawer
      v-model:show="showDetailPanel"
      resizable
      :default-width="640"
      :max-width="1200"
      :min-width="480"
      :show-mask="false"
      :mask-closable="false"
      :on-esc="handleEscEvent"
    >
      <NDrawerContent>
        <template #header>
          <header class="flex justify-between items-center">
            <h2>{{ currentActiveTool.name }}</h2>
            <NButton
              circle
              type="error"
              size="small"
              @click="handleCloseToolsDetail"
            >
              <IconClose />
            </NButton>
          </header>
        </template>
        <component :is="currentActiveTool.component" />

        <!-- <template #footer>
      </template> -->
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style lang="scss" scoped>
.tool-app {
  border: 1px solid var(--border-color);
}
</style>
