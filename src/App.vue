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
import { storeAside } from "@/stores/modules/aside/index";
import { storeApp } from "@/stores/modules/app/index";
import { onMounted, nextTick } from "vue";
import { useKeyboardShortcuts } from "@/composables/shortcuts/useKeyboardShortcuts";
import { ShortcutAction } from "@/composables/shortcuts/config";

const storeRssInstance = storeRss();
const storeSettingsInstance = storeSettings();
const storePlayerInstance = storePlayer();
const storeTabInstance = storeTab();
const storeAsideInstance = storeAside();
const storeAppInstance = storeApp();

// 快捷键处理函数
const shortcutHandlers = {
  // 播放器快捷键
  [ShortcutAction.TOGGLE_PLAYER]: () => {
    if (storePlayerInstance.isPlayerVisible) {
      storePlayerInstance.hidePlayer();
    } else {
      storePlayerInstance.showPlayer();
    }
  },

  // 面板切换快捷键
  [ShortcutAction.SWITCH_TO_RSS]: () => {
    storeAsideInstance.switchPanel("rss");
  },

  [ShortcutAction.SWITCH_TO_TOOLS]: () => {
    storeAsideInstance.switchPanel("tools");
  },

  [ShortcutAction.SWITCH_TO_FAVORITES]: () => {
    storeAsideInstance.switchPanel("favorites");
  },

  [ShortcutAction.SWITCH_TO_SHARE]: () => {
    storeAsideInstance.switchPanel("share");
  },

  // 设置快捷键
  [ShortcutAction.OPEN_SETTINGS]: () => {
    if (storeSettingsInstance.showSettingDialog) {
      storeSettingsInstance.closeSetting();
    } else {
      storeSettingsInstance.openSetting();
    }
  },

  // 主题切换快捷键
  [ShortcutAction.TOGGLE_THEME]: () => {
    // 主题模式顺序：system -> light -> dark -> system
    const themeOrder = ['system', 'light', 'dark'];
    const currentTheme = storeSettingsInstance.themeMode;
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    storeSettingsInstance.setThemeMode(themeOrder[nextIndex]);
  },

  // 笔记快捷键
  [ShortcutAction.OPEN_NOTES]: () => {
    storeAppInstance.openNotesDialog();
  },

  // 任务快捷键
  [ShortcutAction.OPEN_TASKS]: () => {
    storeAppInstance.openTasksDialog();
  },

  // 搜索快捷键
  [ShortcutAction.OPEN_SEARCH]: () => {
    storeAppInstance.focusSearchBox();
  },
};

// 注册快捷键
useKeyboardShortcuts(shortcutHandlers);

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
