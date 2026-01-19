<script setup>
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
} from "naive-ui";

import { themeOverrides } from "./theme/index.js";

import MainPanelView from "./views/MainPanel/MainPanelView.vue";
import AsidePanelView from "./views/AsidePanel/AsidePanelView.vue";
import SettingDialog from "./components/dialogs/SettingDialog/SettingDialog.vue";
import RssManagementDialog from "./components/dialogs/RssManagementDialog/RssManagementDialog.vue";
import PlayerView from "./components/player/PlayerView.vue";

import { storeRss } from "@/stores/modules/rss/index";
import { storeSettings } from "@/stores/modules/settings/index";
import { storePlayer } from "@/stores/modules/player/index";
import { storeTab } from "@/stores/modules/tab/index";
import { onMounted, nextTick } from "vue";

const storeRssInstance = storeRss();
const storeSettingsInstance = storeSettings();
const storePlayerInstance = storePlayer();
const storeTabInstance = storeTab();

onMounted(() => {
  storeSettingsInstance.initializeSettings();

  nextTick(async () => {
    // 先初始化 Tab store 和 RSS store，确保存储数据已加载
    await Promise.all([
      storeTabInstance.init(),
      storeRssInstance.init()
    ]);
    // 然后批量更新 RSS
    storeRssInstance.batchUpdateRss();
  });
});
</script>

<template>
  <NConfigProvider class="inherit-app" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <AsidePanelView />
          <MainPanelView />

          <SettingDialog />
          <RssManagementDialog />

          <PlayerView />
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style lang="scss" scoped>
.inherit-app {
  display: inherit;
  width: inherit;
  height: inherit;
  margin: inherit;
  overflow: inherit;
  position: relative;
}
</style>
