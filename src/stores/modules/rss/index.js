import { defineStore } from "pinia";
import {
  isArray,
  calculateTimeDifference,
  genISOWithZoneToDate,
} from "@linxs/toolkit";
import { storageManager, STORAGE_KEYS } from "../../storage";
import { RSS_SOURCE_TYPES } from "./config";
import { RssProcessorFactory } from "@/services/rss/processor";
import { storeTab } from "../tab/index";
import { DEFAULT_PANEL } from "@/stores/config";

export const storeRss = defineStore({
  id: "StoreRss",

  state: () => ({
    // RSS 源列表
    sources: storageManager.get(STORAGE_KEYS.RSS_SOURCES) || [],
    // 添加源对话框显示状态
    showAddDialog: false,
    // 当前显示的数据内容
    currentList: [],
  }),

  getters: {
    // 获取所有 RSS 源
    getSources: (state) => state.sources,
    getCurrentList: (state) => state.currentList,
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

    // 添加 RSS 源
    async addSource(source, cover = false) {
      // 检查是否已存在相同的源
      const exists = this.sources.some((s) => s.sourceUrl === source.sourceUrl);
      if (exists) {
        throw new Error("该 RSS 源已存在");
      }

      try {
        const newSource = await fetchSourceInfo(source);

        this.sources.push(newSource);
        this.saveSources();
        this.closeAddDialog();

        const rssInfo = getRssTypeInfo(source.type);
        const tab = storeTab();

        tab.addTab(DEFAULT_PANEL, {
          label: rssInfo ? rssInfo.label : source.name,
          value: rssInfo ? rssInfo.value : source.type,
        });

        return newSource;
      } catch (error) {
        console.error("添加 RSS 源失败:", error);
        throw new Error(`添加 RSS 源失败: ${error.message}`);
      }
    },

    // 删除 RSS 源
    removeSource(sourceId) {
      const index = this.sources.findIndex((s) => s.id === sourceId);
      if (index === -1) return;

      this.sources.splice(index, 1);
      this.saveSources();

      // 触发当前列表更新
      const tab = storeTab();
      this.switchSourceData(tab.getActiveTabId(DEFAULT_PANEL));
    },

    // 更新 RSS 源
    updateSource(sourceId, updates) {
      const source = this.sources.find((s) => s.id === sourceId);
      if (source) {
        Object.assign(source, updates);
        this.saveSources();
      }
    },

    // 保存到存储
    saveSources() {
      storageManager.set(STORAGE_KEYS.RSS_SOURCES, this.sources);
    },

    // 初始化
    init() {
      // 初始化 RSS 源
      if (this.sources.length === 0) {
        this.sources = [];
        this.saveSources();
      }
      const tab = storeTab();

      // 初始化显示数据
      this.switchSourceData(tab.getActiveTabId("rss"));
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
      const updateItems = this.sources.filter((rss) => {
        const { h } = calculateTimeDifference(
          rss.lastUpdateTime,
          genISOWithZoneToDate().getTime()
        );
        return h > 12;
      });

      try {
        const results = await Promise.allSettled(
          updateItems.map(async (item) => {
            const newSource = await fetchSourceInfo(item);

            const newList = differenceLatestItems(item.list, newSource.list);

            const newRss = this.sources.find((s) => s.id === item.id);
            newRss.list = newList;
            newRss.lastUpdateTime = genISOWithZoneToDate().getTime();

            return newRss;
          })
        );

        this.saveSources();
      } catch (error) {}
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
      const originItem = originList.find((i) => i.link === item.link);
      if (!originItem) {
        originList.splice(index, 0, item);
      }
    }
  });

  return [...originList];
};
