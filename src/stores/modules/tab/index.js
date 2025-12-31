import { defineStore } from "pinia";
import { storageManager } from "../../storage";
import { getPanelKeys, isPanelValid } from "../../config/panelConfig";

const MAX_TABS = 6;
const DEFAULT_TABS = [{ id: "all", label: "全部" }];

// 初始化所有面板的默认 tab 状态
const initializePanelTabsState = () => {
  const state = {};

  getPanelKeys().forEach((panelKey) => {
    if (!isPanelValid(panelKey)) return;

    const stored = storageManager.getTabState(panelKey) || {};
    state[panelKey] = {
      tabs: [...DEFAULT_TABS],
      activeId: stored.activeId || "all",
    };
  });
  return state;
};

export const storeTab = defineStore("tab", {
  state: () => ({
    // 每个面板的 tab 列表和选中状态
    panelTabs: initializePanelTabsState(),
  }),

  getters: {
    // 获取指定面板的 tab 列表
    getTabs: (state) => (panelKey) => state.panelTabs[panelKey]?.tabs || [],

    // 获取指定面板当前选中的 tab ID
    getActiveTabId: (state) => (panelKey) =>
      state.panelTabs[panelKey]?.activeId || "all",

    // 获取指定面板当前选中的 tab 对象
    getActiveTab: (state) => (panelKey) => {
      const panel = state.panelTabs[panelKey];
      if (!panel) return DEFAULT_TABS[0];
      return (
        panel.tabs.find((tab) => tab.id === panel.activeId) || DEFAULT_TABS[0]
      );
    },
  },

  actions: {
    // 添加新的 tab
    addTab(panelKey, tabInfo) {
      const panel = this.panelTabs[panelKey];
      if (!panel) return false;

      // 检查是否达到上限
      if (panel.tabs.length >= MAX_TABS) {
        return false;
      }

      const { label, value } = tabInfo;

      // 检查是否已存在相同标签的 tab
      const existingTab = panel.tabs.find((tab) => tab.label === label);
      if (existingTab) {
        return false; // 如果已存在相同标签的 tab，不再添加
      }

      panel.tabs.push({ id: value, label, value });

      // 保存到本地存储
      this.saveToStorage(panelKey);
      return true;
    },

    // 删除 tab
    removeTab(panelKey, tabId) {
      const panel = this.panelTabs[panelKey];
      if (!panel) return;

      // 不允许删除"全部" tab
      if (tabId === "all") return;

      const index = panel.tabs.findIndex((tab) => tab.id === tabId);
      if (index > -1) {
        panel.tabs.splice(index, 1);

        // 如果删除的是当前选中的 tab，切换到"全部"
        if (panel.activeId === tabId) {
          panel.activeId = "all";
        }

        this.saveToStorage(panelKey);
      }
    },

    // 切换选中的 tab
    switchTab(panelKey, tabId) {
      const panel = this.panelTabs[panelKey];
      if (!panel) return;

      if (panel.tabs.some((tab) => tab.id === tabId)) {
        panel.activeId = tabId;
        this.saveToStorage(panelKey);
      }
    },

    // 从本地存储加载状态
    loadFromStorage(panelKey) {
      const stored = storageManager.getTabState(panelKey);
      if (stored) {
        // 确保始终包含"全部" tab
        if (!stored.tabs.some((tab) => tab.id === "all")) {
          stored.tabs.unshift(DEFAULT_TABS[0]);
        }
        this.panelTabs[panelKey] = stored;
      }
    },

    // 保存到本地存储
    saveToStorage(panelKey) {
      const panel = this.panelTabs[panelKey];
      if (panel) {
        storageManager.setTabState(panelKey, panel);
      }
    },

    // 初始化面板的 tabs
    initializePanelTabs(panelKey) {
      if (!this.panelTabs[panelKey]) {
        this.panelTabs[panelKey] = {
          tabs: [...DEFAULT_TABS],
          activeId: "all",
        };
      }
      this.loadFromStorage(panelKey);
    },
  },
});
