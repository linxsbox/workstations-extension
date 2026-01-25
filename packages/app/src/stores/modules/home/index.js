import { defineStore } from "pinia";

/**
 * 首页面板 Store
 * 用于管理首页面板的状态和数据
 */
export const storeHome = defineStore("home", {
  state: () => ({
    // 首页暂无特定状态
  }),

  getters: {},

  actions: {
    /**
     * 初始化首页数据
     */
    async init() {
      // 首页数据从其他 store 获取，无需初始化
    },
  },
});
