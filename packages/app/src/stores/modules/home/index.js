import { defineStore } from "pinia";

/**
 * 生成 Favicon URL
 * @param {string} pageUrl - 页面 URL
 * @returns {string} Favicon URL
 */
const getFaviconUrl = (pageUrl) => {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", "16");
  return url.toString();
};

/**
 * 提取域名
 * @param {string} url - 完整 URL
 * @returns {string} 域名
 */
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    // 降级方案：使用正则提取
    return url.replace(/https?:\/\//, "").split("/")[0];
  }
};

/**
 * 首页面板 Store
 * 用于管理首页面板的状态和数据
 */
export const storeHome = defineStore("home", {
  state: () => ({
    topSites: [],
  }),

  getters: {},

  actions: {
    /**
     * 初始化首页数据
     */
    async init() {
      await this.fetchTopSites();
    },

    /**
     * 获取常访问网站列表
     */
    async fetchTopSites() {
      if (!chrome?.topSites) {
        return;
      }

      try {
        const hotList = await chrome.topSites.get();

        this.topSites = hotList.map((site) => ({
          ...site,
          favicon: getFaviconUrl(site.url),
          domainUrl: extractDomain(site.url),
        }));
      } catch (error) {
        this.topSites = [];
      }
    },
  },
});
