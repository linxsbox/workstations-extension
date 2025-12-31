<script setup>
import { NConfigProvider, NMessageProvider } from "naive-ui";
import { themeOverrides } from "./theme/index.js";

import MainPanelView from "./views/MainPanel/MainPanelView.vue";
import AsidePanelView from "./views/AsidePanel/AsidePanelView.vue";
import SettingDialog from "./components/dialogs/SettingDialog/SettingDialog.vue";
import RssManagementDialog from "./components/dialogs/RssManagementDialog/RssManagementDialog.vue";

import { storeRss } from "@/stores/modules/rss/index";
import { storeSettings } from "@/stores/modules/settings/index";
import { onMounted } from "vue";

const storeRssInstance = storeRss();
storeRssInstance.init();

const storeSettingsInstance = storeSettings();

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
      <AsidePanelView />
      <MainPanelView />

      <SettingDialog />
      <RssManagementDialog />
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
}
</style>
