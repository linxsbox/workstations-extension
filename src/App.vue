<script setup>
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";

import { themeOverrides } from "./theme/index.js";

import MainPanelView from "./views/MainPanel/MainPanelView.vue";
import AsidePanelView from "./views/AsidePanel/AsidePanelView.vue";
import SettingDialog from "./components/dialogs/SettingDialog/SettingDialog.vue";
import RssManagementDialog from "./components/dialogs/RssManagementDialog/RssManagementDialog.vue";
import PlayerView from "./components/player/PlayerView.vue";

import { storeRss } from "@/stores/modules/rss/index";
import { storeSettings } from "@/stores/modules/settings/index";
import { storePlayer } from "@/stores/modules/player/index";
import { onMounted, nextTick } from "vue";

const storeRssInstance = storeRss();
storeRssInstance.init();

const storeSettingsInstance = storeSettings();

const storePlayerInstance = storePlayer();

onMounted(() => {
  storeSettingsInstance.initializeSettings();

  nextTick(() => {
    storeRssInstance.batchUpdateRss();
  });
});
</script>

<template>
  <NConfigProvider class="inherit-app" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NDialogProvider>
        <AsidePanelView />
        <MainPanelView />

        <SettingDialog />
        <RssManagementDialog />

        <PlayerView />

        <div class="fixed bottom-5 right-5 cursor-pointer" @click="storePlayerInstance.showPlayer()">打开播放器</div>
      </NDialogProvider>
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
