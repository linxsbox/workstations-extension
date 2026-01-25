import { defineStore } from "pinia";
import { PubSub } from "@linxs/toolkit";

// 创建 Service Worker 事件总线
const serviceWorkerEventBus = new PubSub({
  maxListeners: 50,
  logErrors: true,
});

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
    // Service Worker 事件总线初始化状态
    isServiceWorkerEventBusInitialized: false,
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

    // ==================== Service Worker 事件总线 ====================

    /**
     * 初始化 Service Worker 事件总线
     * 统一监听所有来自 Service Worker 的消息
     */
    initServiceWorkerEventBus() {
      if (this.isServiceWorkerEventBusInitialized) {
        console.log('[App Store] Service Worker 事件总线已初始化');
        return;
      }

      // 统一监听 chrome.runtime.onMessage
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const { type } = message;

        if (!type) {
          console.warn('[App Store] 收到无类型的消息:', message);
          return false;
        }

        console.log('[App Store] 分发事件:', type);

        // 通过事件总线分发
        serviceWorkerEventBus.emit(type, message, sender);

        return false; // 同步响应
      });

      this.isServiceWorkerEventBusInitialized = true;
      console.log('[App Store] Service Worker 事件总线已初始化');
    },

    /**
     * 订阅 Service Worker 事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    onServiceWorkerEvent(eventType, callback) {
      return serviceWorkerEventBus.on(eventType, callback);
    },

    /**
     * 一次性订阅 Service Worker 事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    onceServiceWorkerEvent(eventType, callback) {
      return serviceWorkerEventBus.once(eventType, callback);
    },

    /**
     * 取消订阅 Service Worker 事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    offServiceWorkerEvent(eventType, callback) {
      serviceWorkerEventBus.off(eventType, callback);
    },
  },
});
