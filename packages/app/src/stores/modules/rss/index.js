import { defineStore } from "pinia";
import {
  isArray,
  calculateTimeDifference,
  genISOWithZoneToDate,
} from "@linxs/toolkit";
import { storageManager, STORAGE_KEYS } from "../../storage";
import { RSS_SOURCE_TYPES, RSS_UPDATE_COOLDOWN, RSS_BATCH_UPDATE_INTERVAL } from "./config";
import { RssProcessorFactory } from "@/services/rss/processor";
import { storeRssTabs } from "./tabs";

export const storeRss = defineStore({
  id: "StoreRss",

  state: () => ({
    // RSS 源列表
    sources: storageManager.get(STORAGE_KEYS.RSS_SOURCES) || [],
    // 添加源对话框显示状态
    showAddDialog: false,
    // 当前显示的数据内容
    currentList: [],
    // 标记是否已初始化监听器
    isListenerInitialized: false,
    // 分享卡片对话框状态
    showShareDialog: false,
    shareItemLink: null,
  }),

  getters: {
    // 获取所有 RSS 源
    getSources: (state) => state.sources,
    getCurrentList: (state) => state.currentList,

    // 获取当前要分享的项目
    getShareItem: (state) => {
      if (!state.shareItemLink) return null;

      // 从当前列表中查找
      const item = state.currentList.find(i => i.link === state.shareItemLink);
      if (item) return item;

      // 如果当前列表中没有，从所有源中查找
      for (const source of state.sources) {
        const foundItem = source.list?.find(i => i.link === state.shareItemLink);
        if (foundItem) {
          return { ...foundItem, source };  // 附带源信息
        }
      }

      return null;
    },
  },

  actions: {
    // 显示添加源对话框
    openAddDialog() {
      this.showAddDialog = true;
    },

    // 关闭添加源对话框
    closeAddDialog() {
      this.showAddDialog = false;
    },

    // 打开分享对话框
    openShareDialog(itemLink) {
      this.shareItemLink = itemLink;
      this.showShareDialog = true;
    },

    // 关闭分享对话框
    closeShareDialog() {
      this.showShareDialog = false;
      this.shareItemLink = null;
    },

    // 添加 RSS 源
    async addSource(source, options = {}) {
      const { closeDialog = true } = options;

      // 检查是否已存在相同的源
      const exists = this.sources.some((s) => s.sourceUrl === source.sourceUrl);
      if (exists) {
        throw new Error("该 RSS 源已存在");
      }

      try {
        const newSource = await fetchSourceInfo(source);

        this.sources.push(newSource);
        this.saveSources();

        if (closeDialog) {
          this.closeAddDialog();
        }

        const rssInfo = getRssTypeInfo(source.type);
        const tabsStore = storeRssTabs();

        tabsStore.addTab({
          label: rssInfo ? rssInfo.label : source.name,
          value: rssInfo ? rssInfo.value : source.type,
        });

        // 触发当前列表更新
        this.switchSourceData(tabsStore.getActiveTabId);

        return newSource;
      } catch (error) {
        console.error("添加 RSS 源失败:", error);
        throw new Error(`添加 RSS 源失败: ${error.message}`);
      }
    },

    // 删除 RSS 源
    removeSource(sourceUrl) {
      const index = this.sources.findIndex((s) => s.sourceUrl === sourceUrl);
      if (index === -1) return;

      this.sources.splice(index, 1);
      this.saveSources();

      // 触发当前列表更新
      const tabsStore = storeRssTabs();
      this.switchSourceData(tabsStore.getActiveTabId);
    },

    // 更新 RSS 源
    async updateSource(sourceUrl, forceUpdate = false) {
      const source = this.sources.find((s) => s.sourceUrl === sourceUrl);
      if (!source) {
        throw new Error('RSS 源不存在');
      }

      // 检查冷却时间（除非强制更新）
      if (!forceUpdate) {
        const now = genISOWithZoneToDate().getTime();
        const lastUpdate = source.lastUpdateTime || 0;
        const cooldown = RSS_UPDATE_COOLDOWN;

        if (now - lastUpdate < cooldown) {
          return;
        }
      }

      try {
        // 获取新数据
        const freshData = await fetchSourceInfo(source);

        // diff 新旧数据，只添加新内容（倒序）
        const mergedList = differenceLatestItems(source.list, freshData.list);

        // 更新源数据
        source.list = mergedList;
        source.lastUpdateTime = genISOWithZoneToDate().getTime();

        // 保存
        this.saveSources();

        // 如果当前正在查看这个源，更新显示
        if (this.currentSourceData?.sourceUrl === sourceUrl) {
          this.currentSourceData = { ...source };
        }
      } catch (error) {
        console.error('更新 RSS 源失败:', error);
        throw error;
      }
    },

    // 强制刷新指定 RSS 源（重新获取所有数据）
    async refreshSource(sourceUrl) {
      const source = this.sources.find((s) => s.sourceUrl === sourceUrl);
      if (!source) {
        throw new Error('RSS 源不存在');
      }

      try {
        const freshData = await fetchSourceInfo(source);

        // 完全替换数据（包括 list）
        const index = this.sources.findIndex((s) => s.sourceUrl === sourceUrl);
        if (index > -1) {
          this.sources[index] = { ...source, ...freshData };
          this.saveSources();

          // 如果当前正在查看这个源，更新显示
          if (this.currentSourceData?.sourceUrl === sourceUrl) {
            this.currentSourceData = this.sources[index];
          }
        }

        return this.sources[index];
      } catch (error) {
        console.error('刷新 RSS 源失败:', error);
        throw new Error(`刷新 RSS 源失败: ${error.message}`);
      }
    },

    // 保存到存储
    saveSources() {
      storageManager.set(STORAGE_KEYS.RSS_SOURCES, this.sources);
    },

    // 初始化
    async init() {
      // 等待存储初始化完成，确保数据已从 chrome.storage 加载
      await storageManager.waitForInit();

      // 重新从存储加载 RSS 源（此时缓存已初始化完成）
      const savedSources = storageManager.get(STORAGE_KEYS.RSS_SOURCES);
      if (savedSources && savedSources.length > 0) {
        this.sources = savedSources;
      }

      const tabsStore = storeRssTabs();

      // 初始化显示数据
      this.switchSourceData(tabsStore.getActiveTabId);

      // 初始化 service worker 消息监听器（只初始化一次）
      if (!this.isListenerInitialized && chrome?.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'RSS_UPDATE_TRIGGER') {
            console.log(`[StoreRss] 收到 RSS 更新触发消息 - 时间: ${message.hour}:00`);

            // 执行批量更新
            this.batchUpdateRss();

            sendResponse({ success: true });
          }
        });

        this.isListenerInitialized = true;
        console.log('[StoreRss] RSS 更新监听器已初始化');
      }
    },

    // 切换数据显示
    switchSourceData(tabId) {
      // 为显示列表项服务并排序
      const newList = (list = []) => {
        const tmpList = [];
        list.forEach((item) => {
          tmpList.push(item);
          // item.list &&
          //   item.list.forEach((tmp) => {
          //     tmpList.push(tmp);
          //   });
        });

        // tmpList.sort((a, b) => b.timestamp - a.timestamp);

        return tmpList;
      };

      this.currentList =
        tabId === "all"
          ? newList(this.getSources)
          : newList(this.getSources.filter((item) => item.type === tabId));
    },

    // 批量导入添加 RSS 源
    async batchImportRss(rsslist = []) {
      const failedItems = []; // Array to hold names of failed items

      try {
        const results = await Promise.allSettled(
          rsslist.map((item) =>
            fetchSourceInfo(item).catch((error) => {
              failedItems.push(item.name); // Record the failed item's name
            })
          )
        );

        const tab = storeTab();

        const tempSources = [];
        results.forEach((result) => {
          result.status === "fulfilled" && tempSources.push(result.value);
          const rssInfo = getRssTypeInfo(result.value.type);

          tab.addTab(DEFAULT_PANEL, {
            label: rssInfo ? rssInfo.label : result.value.name,
            value: rssInfo ? rssInfo.value : result.value.type,
          });
        });

        this.sources.push(...tempSources);
        this.saveSources();
        this.closeAddDialog();

        return { state: 1, failedItems };
      } catch (error) {
        return { state: 0, failedItems };
      }
    },

    // 批量获取更新的 RSS
    async batchUpdateRss() {
      // 筛选出超过指定时间未更新的源
      const updateItems = this.sources.filter((rss) => {
        const { h } = calculateTimeDifference(
          rss.lastUpdateTime,
          genISOWithZoneToDate().getTime()
        );
        return h > RSS_BATCH_UPDATE_INTERVAL;
      });

      if (updateItems.length === 0) {
        console.log('[BatchUpdate] 没有需要更新的 RSS 源');
        return;
      }

      console.log(`[BatchUpdate] 开始批量更新 ${updateItems.length} 个 RSS 源`);

      try {
        // 使用 updateSource 批量更新（不强制，走冷却检查）
        const results = await Promise.allSettled(
          updateItems.map((item) => this.updateSource(item.id, false))
        );

        // 统计结果
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`[BatchUpdate] 完成 - 成功: ${succeeded}, 失败: ${failed}`);
      } catch (error) {
        console.error('[BatchUpdate] 批量更新失败:', error);
      }
    },

    // 标记 RSS 项为已读
    markAsRead(itemLink) {
      let updated = false;

      this.sources.forEach((source) => {
        const item = source.list?.find((i) => i.link === itemLink);
        if (item && item.isNew) {
          item.isNew = false;
          item.readAt = genISOWithZoneToDate().getTime();
          updated = true;
        }
      });

      if (updated) {
        this.saveSources();

        // 如果当前显示列表包含该项，更新显示
        const currentItem = this.currentList.find((i) => i.link === itemLink);
        if (currentItem) {
          currentItem.isNew = false;
          currentItem.readAt = genISOWithZoneToDate().getTime();
        }
      }

      return updated;
    },
  },
});

// 获取 RSS 源信息
const fetchSourceInfo = async (source) => {
  try {
    // 使用工厂方法创建处理器并验证源
    const processor = RssProcessorFactory.create(source);
    await processor.validate();

    // 获取源信息
    const sourceInfo = await processor.fetchSourceInfo();

    // 合并源信息和用户提供的信息
    return {
      ...source,
      ...sourceInfo,
    };
  } catch (error) {
    console.error("添加 RSS 源失败:", error);
    throw new Error(`添加 RSS 源失败: ${error.message}`);
  }
};

// 获取 RSS 类型信息
const getRssTypeInfo = (type) => {
  return RSS_SOURCE_TYPES.find((item) => item.value === type);
};

// 获取最新数据，合并差异部分
const differenceLatestItems = (originList = [], newList = []) => {
  if (!isArray(originList) || !isArray(newList)) {
    return;
  }

  newList.forEach((item, index) => {
    if (item.link) {
      const originIndex = originList.findIndex((i) => i.link === item.link);
      if (originIndex === -1) {
        // 不存在，插入新项并标记为新内容
        originList.splice(index, 0, {
          ...item,
          isNew: true,    // 标记为新内容
          readAt: null    // 未读状态
        });
      } else {
        // 已存在，更新数据（保留新数据的 duration 等字段，但保持原有的 isNew 和 readAt）
        const existing = originList[originIndex];
        originList[originIndex] = {
          ...existing,
          ...item,
          isNew: existing.isNew ?? false,      // 保留原有的已读状态
          readAt: existing.readAt ?? null      // 保留原有的阅读时间
        };
      }
    }
  });

  return [...originList];
};
