<script setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { NScrollbar } from "naive-ui";
import RssTabBar from "./RssTabBar.vue";
import RssListView from "./RssListView.vue";
import IconRss from "@/components/common/Icons/IconRss.vue";
import ShareCardDialog from "@/components/dialogs/ShareCardDialog/ShareCardDialog.vue";
import ShareCard from "@/components/dialogs/ShareCardDialog/components/Cards/IndexView.vue";
import { storeRss } from "@/stores/modules/rss";

const store = storeRss();
const { getCurrentList, showShareDialog, getShareItem } = storeToRefs(store);

// 切换 tab 触发 list 刷新
const handleSwitchTab = (tabId) => {
  store.switchSourceData(tabId);
};

// 打开订阅源管理
const handleRssManageClick = () => {
  store.openAddDialog();
};

// 准备分享数据
const shareData = computed(() => {
  const item = getShareItem.value;
  if (!item) return {};

  // 从 album 或 source 获取封面和作者信息
  const album = item.album || item.source;

  return {
    coverUrl: album?.image || album?.cover || '',
    title: item.title || '',
    artist: album?.author || item.author || album?.title || '',
    qrcode: item.link || '', // 原文链接用于生成二维码
  };
});

// 监听卡片数据变化（可选，如果需要同步更新）
const handleCardChange = (newData) => {
  // 暂时不需要处理，因为分享卡片是临时的
  console.log('Card data changed:', newData);
};
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <div class="flex-none flex items-center justify-between gap-2 px-4 py-2 border-b">
      <RssTabBar @change="handleSwitchTab" />
      <button
        class="rss-manage-button flex-none bg-transparent inline-flex justify-center items-center gap-2 py-1 px-3 border rounded-md"
        type="button"
        @click="handleRssManageClick"
      >
        <IconRss class="text-base" />
        <span class="text-sm">订阅源管理</span>
      </button>
    </div>

    <NScrollbar class="flex-1 p-4" content-class="flex h-[inherit] gap-3">
      <template v-for="item in getCurrentList" :key="item.id">
        <RssListView :data="item" />
      </template>
    </NScrollbar>

    <!-- 分享卡片对话框 -->
    <ShareCardDialog v-model:show="showShareDialog">
      <ShareCard :data="shareData" @change="handleCardChange" />
    </ShareCardDialog>
  </div>
</template>

<style lang="scss" scoped>
.rss-manage-button {
  color: var(--text-primary);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--interactive-bg-hover-1);
  }

  &:active {
    background-color: var(--interactive-bg-active-1);
  }
}
</style>
