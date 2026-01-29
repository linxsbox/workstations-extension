/**
 * 移动端同步 Store
 * 管理 WebRTC 连接状态和 UI 显示
 */

import { defineStore } from 'pinia';
import { initialize } from '@/services/webrtc';

/**
 * MobileSync 连接状态常量
 */
export const SYNC_STATUS = {
  IDLE: 'IDLE', // 未初始化
  INITIALIZING: 'INITIALIZING', // 初始化中
  READY: 'READY', // 就绪，等待连接
  CONNECTED: 'CONNECTED', // 已连接
  ERROR: 'ERROR', // 错误
};

export const storeMobileSync = defineStore('mobileSync', {
  state: () => ({
    // UI 状态
    showQRDialog: false,

    // 连接状态
    status: SYNC_STATUS.IDLE,
    currentStatus: SYNC_STATUS.IDLE,

    // WebRTC 状态（从 webrtcService 同步）
    peerId: null,
    isReady: false,
    connections: [],
  }),

  getters: {
    /**
     * 是否已连接
     */
    isConnected: (state) => state.isReady && state.connections.length > 0,

    /**
     * 动态生成二维码 URL
     */
    qrUrl: (state) => {
      if (!state.peerId) return null;
      // TODO: 替换为实际的移动端页面地址
      return `http://172.17.4.102:5500/mobile-demo.html?peer=${state.peerId}`;
    },

    /**
     * 已连接的设备列表
     */
    connectedDevices: (state) => {
      return state.connections.map((peerId) => ({
        id: peerId,
        name: `设备 ${peerId.slice(-4)}`,
      }));
    },
  },

  actions: {
    /**
     * 初始化 Store
     * 在应用启动时调用
     */
    async initialize() {
      initialize();
    },

    /**
     * 处理接收到的数据
     */
    handleReceivedData(data) {
      // 根据数据类型分发处理
      switch (data.type) {
        case 'NOTE':
          // 处理笔记数据
          this.handleNoteData(data);
          break;

        case 'CLIPBOARD':
          // 处理剪贴板数据
          this.handleClipboardData(data);
          break;

        case 'FILE':
          // 处理文件数据
          this.handleFileData(data);
          break;

        default:
          console.warn('[MobileSync Store] 未知的数据类型:', data.type);
      }
    },

    /**
     * 处理笔记数据
     */
    handleNoteData(data) {
      console.log('[MobileSync Store] 收到笔记数据:', data);
      // TODO: 保存到 notes store
    },

    /**
     * 处理剪贴板数据
     */
    handleClipboardData(data) {
      console.log('[MobileSync Store] 收到剪贴板数据:', data);
      // TODO: 复制到系统剪贴板
    },

    /**
     * 处理文件数据
     */
    handleFileData(data) {
      console.log('[MobileSync Store] 收到文件数据:', data);
      // TODO: 保存文件
    },

    /**
     * 打开二维码弹窗
     */
    openQRDialog() {
      this.showQRDialog = true;
    },

    /**
     * 关闭二维码弹窗
     */
    closeQRDialog() {
      this.showQRDialog = false;
    },
  },
});
