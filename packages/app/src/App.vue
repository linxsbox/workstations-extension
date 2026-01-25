<script setup>
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  zhCN,
  dateZhCN,
} from "naive-ui";

import { themeOverrides } from "./theme/index.js";

import MainPanelView from "./views/MainPanel/MainPanelView.vue";
import AsidePanelView from "./views/AsidePanel/AsidePanelView.vue";
import SettingDialog from "./components/dialogs/SettingDialog/SettingDialog.vue";
import RssManagementDialog from "./components/dialogs/RssManagementDialog/RssManagementDialog.vue";
import PlayerView from "./components/player/PlayerView.vue";

import { storeRss } from "@/stores/modules/rss/index";
import { storeRssTabs } from "@/stores/modules/rss/tabs";
import { storeSettings } from "@/stores/global/settings/index";
import { storePlayer } from "@/stores/global/player/index";
import { storeTab } from "@/stores/global/tab/index";
import { storeAside } from "@/stores/global/aside/index";
import { storeApp } from "@/stores/global/app/index";
import { storeTasks } from "@/stores/miniapps/tasks";
import { storeNotes } from "@/stores/miniapps/notes";
import { onMounted, nextTick } from "vue";
import { useKeyboardShortcuts } from "@/composables/shortcuts/useKeyboardShortcuts";
import { ShortcutAction, getPanelAction } from "@/composables/shortcuts/config";
import { getPanelKeys } from "@/stores/config/panelConfig";

const storeRssInstance = storeRss();
const storeRssTabsInstance = storeRssTabs();
const storeSettingsInstance = storeSettings();
const storePlayerInstance = storePlayer();
const storeTabInstance = storeTab();
const storeAsideInstance = storeAside();
const storeAppInstance = storeApp();
const storeTasksInstance = storeTasks();
const storeNotesInstance = storeNotes();

// 动态生成面板切换处理函数
const generatePanelHandlers = () => {
  const panelKeys = getPanelKeys();
  const handlers = {};

  panelKeys.forEach((key, index) => {
    const action = getPanelAction(index);
    handlers[action] = () => {
      storeAsideInstance.switchPanel(key);
    };
  });

  return handlers;
};

// 快捷键处理函数
const shortcutHandlers = {
  // 面板切换快捷键（动态生成）
  ...generatePanelHandlers(),

  // 播放器快捷键
  [ShortcutAction.TOGGLE_PLAYER]: () => {
    if (storePlayerInstance.isPlayerVisible) {
      storePlayerInstance.hidePlayer();
    } else {
      storePlayerInstance.showPlayer();
    }
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
    // 初始化所有 store，确保存储数据已加载
    await Promise.all([
      storeTabInstance.init(),
      storeRssInstance.init(),
      storeRssTabsInstance.init(),
      storeTasksInstance.init(),
      storeNotesInstance.init(),
    ]);
    // 然后批量更新 RSS
    storeRssInstance.batchUpdateRss();
  });
});
</script>

<template>
  <NConfigProvider
    class="inherit-app"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
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
