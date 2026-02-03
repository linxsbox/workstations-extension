/**
 * 移动端同步 Store
 * 管理 WebRTC 连接状态和 UI 显示
 */

import { defineStore } from 'pinia';
import { initialize } from '@/services/webrtc';
import { WEBRTC_ACTIONS } from 'pkg-utils';

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

    // WebRTC 状态
    peerId: null,
    isReady: false,
    connections: [],
    errorMessage: null,
  }),

  getters: {
    /**
     * 是否已连接
     */
    isConnected: (state) => state.isReady && state.connections.length > 0,

    /**
     * 当前状态（兼容旧代码）
     */
    currentStatus: (state) => state.status,

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
     * 初始化 WebRTC
     * 用户点击"开启同步"时调用
     */
    async initialize() {
      if (this.status !== SYNC_STATUS.IDLE) {
        console.log('[MobileSync] 已初始化，跳过');
        return;
      }

      try {
        this.status = SYNC_STATUS.INITIALIZING;
        this.errorMessage = null;

        // 注册全局事件监听（接收来自 WebRTC Service 的事件）
        this.setupEventListeners();

        // 调用 WebRTC Service 初始化
        // 新流程：
        // 1. 注册 chrome.runtime.onMessage 监听器（等待 READY）
        // 2. 发送 INIT 给 Extension
        // 3. Extension 初始化 Peer 和 SharedClient
        // 4. Peer READY 后通过 chrome.runtime.sendMessage 发送 READY + peerId
        // 5. App 收到 READY 后创建 SharedClient
        // 6. 返回的 Promise 在收到 READY 后 resolve
        const result = await initialize();

        console.log('[MobileSync] 初始化完成，Peer ID:', result.peerId);

        // 更新 Store 状态
        this.peerId = result.peerId;
        this.isReady = true;
        this.status = SYNC_STATUS.READY;

        // initialize() 的 Promise 已经在收到 READY 后 resolve
        // 不需要再等待额外的 Promise
        return result;
      } catch (error) {
        console.error('[MobileSync] 初始化失败:', error);
        this.status = SYNC_STATUS.ERROR;
        this.errorMessage = error.message;
        throw error;
      }
    },

    /**
     * 注册事件监听器
     */
    setupEventListeners() {
      window.addEventListener(
        'webrtc-message',
        this.handleWebRTCMessage.bind(this)
      );
    },

    /**
     * 处理 WebRTC 消息
     */
    handleWebRTCMessage(event) {
      const { type, data } = event.detail;

      console.log('[MobileSync] 处理 WebRTC 消息:', type, data);

      switch (type) {
        case WEBRTC_ACTIONS.READY:
          this.handleWebRTCReady(data);
          break;

        case WEBRTC_ACTIONS.ERROR:
          this.handleWebRTCError(data);
          break;

        case WEBRTC_ACTIONS.MODULE_NAME: // 来自移动端的数据
          this.handleReceivedData(data);
          break;

        case WEBRTC_ACTIONS.CONNECTION_OPENED:
          this.handleConnectionOpened(data);
          break;

        case WEBRTC_ACTIONS.CONNECTION_CLOSED:
          this.handleConnectionClosed(data);
          break;

        case WEBRTC_ACTIONS.CONNECTION_ERROR:
          this.handleConnectionError(data);
          break;

        case WEBRTC_ACTIONS.DISCONNECTED:
          this.handleDisconnected(data);
          break;

        case WEBRTC_ACTIONS.CLOSED:
          this.handleClosed(data);
          break;

        default:
          console.warn('[MobileSync] 未处理的消息类型:', type);
      }
    },

    /**
     * WebRTC 就绪
     */
    handleWebRTCReady(data) {
      console.log('[MobileSync] WebRTC 已就绪, Peer ID:', data.peerId);
      this.peerId = data.peerId;
      this.isReady = true;
      this.status = SYNC_STATUS.READY;
    },

    /**
     * WebRTC 错误
     */
    handleWebRTCError(data) {
      console.error('[MobileSync] WebRTC 错误:', data.error);
      this.status = SYNC_STATUS.ERROR;
      this.errorMessage = data.error;
    },

    /**
     * 设备连接
     */
    handleConnectionOpened(data) {
      console.log('[MobileSync] 设备已连接:', data.peer);
      if (!this.connections.includes(data.peer)) {
        this.connections.push(data.peer);
      }
      this.status = SYNC_STATUS.CONNECTED;
    },

    /**
     * 设备断开
     */
    handleConnectionClosed(data) {
      console.log('[MobileSync] 设备已断开:', data.peer);
      const index = this.connections.indexOf(data.peer);
      if (index > -1) {
        this.connections.splice(index, 1);
      }

      if (this.connections.length === 0 && this.isReady) {
        this.status = SYNC_STATUS.READY;
      }
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
          console.warn('[MobileSync] 未知的数据类型:', data.type);
      }
    },

    /**
     * 处理笔记数据
     */
    handleNoteData(data) {
      console.log('[MobileSync] 收到笔记数据:', data);
      // TODO: 保存到 notes store
    },

    /**
     * 处理剪贴板数据
     */
    handleClipboardData(data) {
      console.log('[MobileSync] 收到剪贴板数据:', data);
      // TODO: 复制到系统剪贴板
    },

    /**
     * 处理文件数据
     */
    handleFileData(data) {
      console.log('[MobileSync] 收到文件数据:', data);
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
