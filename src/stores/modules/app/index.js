import { defineStore } from "pinia";

/**
 * 应用全局状态 Store
 * 用于管理应用级别的状态，如对话框显示等
 */
export const storeApp = defineStore("app", {
  state: () => ({
    // 笔记对话框显示状态
    showNotesDialog: false,
    // 任务对话框显示状态
    showTasksDialog: false,
    // 搜索框聚焦触发器
    searchFocusTrigger: 0,
  }),

  actions: {
    /**
     * 打开笔记对话框
     */
    openNotesDialog() {
      this.showNotesDialog = true;
    },

    /**
     * 关闭笔记对话框
     */
    closeNotesDialog() {
      this.showNotesDialog = false;
    },

    /**
     * 打开任务对话框
     */
    openTasksDialog() {
      this.showTasksDialog = true;
    },

    /**
     * 关闭任务对话框
     */
    closeTasksDialog() {
      this.showTasksDialog = false;
    },

    /**
     * 触发搜索框聚焦
     */
    focusSearchBox() {
      this.searchFocusTrigger++;
    },
  },
});
