<script setup>
import { NScrollbar } from "naive-ui";
import TabBarView from "@/components/common/TabBar/TabBarView.vue";
import RssListView from "./RssListView.vue";
import { storeRss } from "@/stores/modules/rss";

const store = storeRss();
const { getCurrentList } = storeToRefs(store);

// 切换 tab 触发 list 刷新
const handleSwitchTab = (tabId) => {
  store.switchSourceData(tabId);
};
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <div class="flex-none px-4 py-2 border-b">
      <TabBarView panelKey="rss" @change="handleSwitchTab" />
    </div>
    <NScrollbar class="flex-1 p-4" content-class="flex h-[inherit] gap-3">
      <template v-for="item in getCurrentList" :key="item.id">
        <RssListView :data="item" />
      </template>
    </NScrollbar>
  </div>
</template>

<style lang="scss" scoped></style>
