import { defineStore } from "pinia";
import { storageManager, STORAGE_KEYS } from "../../storage";
import { panelConfig, DEFAULT_PANEL, isPanelValid } from "../../config/panelConfig";

// 从存储获取上次的面板，如果没有则使用默认值
const getStoredPanel = () => {
  const storedPanel = storageManager.get(STORAGE_KEYS.PANEL_ACTIVE);
  return storedPanel || DEFAULT_PANEL;
};

export const storeAside = defineStore("aside", {
  state: () => {
    const activePanel = getStoredPanel();
    return {
      activeMenuId:
        panelConfig[activePanel]?.id || panelConfig[DEFAULT_PANEL].id,
      activePanel: isPanelValid(activePanel) ? activePanel : DEFAULT_PANEL,
    };
  },

  getters: {
    getActivePanel: (state) => state.activePanel,
    getActiveMenuId: (state) => state.activeMenuId,
    getMenuItems: () =>
      Object.entries(panelConfig).map(([key, item]) => ({
        ...item,
        panel: key,
      })),
    getPanelComponent: () => (panelKey) => {
      const component = panelConfig[panelKey]?.component;
      return component || panelConfig[DEFAULT_PANEL].component;
    },
  },

  actions: {
    switchPanel(panelKey) {
      // 检查面板是否存在且组件已实现
      if (!isPanelValid(panelKey)) return;

      try {
        this.activePanel = panelKey;
        this.activeMenuId = panelConfig[panelKey].id;
        // 保存到存储
        storageManager.set(STORAGE_KEYS.PANEL_ACTIVE, panelKey);
      } catch (error) {
        this.resetToDefault();
      }
    },

    resetToDefault() {
      this.activePanel = DEFAULT_PANEL;
      this.activeMenuId = panelConfig[DEFAULT_PANEL].id;
      // 清除存储
      storageManager.remove(STORAGE_KEYS.PANEL_ACTIVE);
    },
  },
});
