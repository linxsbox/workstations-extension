import { defineStore } from "pinia";
import { storageManager } from "../../storage";

const DEFAULT_TABS = [{ id: "all", label: "全部" }];

/**
 * RSS Tab 管理 Store
 * 负责管理 RSS 面板的 tab 状态
 */
export const storeRssTabs = defineStore("rssTabs", {
  state: () => ({
    // tab 列表
    tabs: [...DEFAULT_TABS],
    // 当前激活的 tab ID
    activeId: "all",
    // 是否已初始化
    isInitialized: false,
  }),

  getters: {
    // 获取所有 tabs
    getTabs: (state) => state.tabs,

    // 获取当前激活的 tab ID
    getActiveTabId: (state) => state.activeId,

    // 获取当前激活的 tab 对象
    getActiveTab: (state) => {
      return state.tabs.find((tab) => tab.id === state.activeId) || DEFAULT_TABS[0];
    },
  },

  actions: {
    /**
     * 初始化 tabs
     */
    async init() {
      if (this.isInitialized) return;

      // 等待存储初始化完成
      await storageManager.waitForInit();

      const stored = storageManager.getRssTabState();

      if (stored && stored.tabs) {
        // 如果有存储的数据，使用存储的 tabs 和 activeId
        // 确保始终包含"全部" tab
        const tabs = stored.tabs.some((tab) => tab.id === "all")
          ? stored.tabs
          : [DEFAULT_TABS[0], ...stored.tabs];

        this.tabs = tabs;
        this.activeId = stored.activeId || "all";
      } else {
        // 没有存储数据时使用默认值
        this.tabs = [...DEFAULT_TABS];
        this.activeId = "all";
      }

      this.isInitialized = true;
    },

    /**
     * 添加 tab
     * @param {Object} tab - tab 对象 { label, value }
     */
    addTab(tab) {
      const { label, value } = tab;

      // 检查是否已存在
      const exists = this.tabs.some((t) => t.id === value);
      if (exists) return;

      // 添加新 tab
      this.tabs.push({
        id: value,
        label: label,
      });

      this.saveState();
    },

    /**
     * 删除 tab
     * @param {string} tabId - tab ID
     */
    removeTab(tabId) {
      // 不能删除"全部" tab
      if (tabId === "all") return;

      const index = this.tabs.findIndex((t) => t.id === tabId);
      if (index === -1) return;

      this.tabs.splice(index, 1);

      // 如果删除的是当前激活的 tab，切换到"全部"
      if (this.activeId === tabId) {
        this.activeId = "all";
      }

      this.saveState();
    },

    /**
     * 切换 tab
     * @param {string} tabId - tab ID
     */
    switchTab(tabId) {
      const tab = this.tabs.find((t) => t.id === tabId);
      if (!tab) return;

      this.activeId = tabId;
      this.saveState();
    },

    /**
     * 保存状态到存储
     */
    saveState() {
      storageManager.setRssTabState({
        tabs: this.tabs,
        activeId: this.activeId,
      });
    },

    /**
     * 重置 tabs
     */
    reset() {
      this.tabs = [...DEFAULT_TABS];
      this.activeId = "all";
      this.saveState();
    },
  },
});
