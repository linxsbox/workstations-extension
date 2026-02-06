/**
 * 移动端同步 Store
 * 管理 WebRTC 连接状态和 UI 显示
 */

import { defineStore } from 'pinia';
import { initialize, tryRestore as tryRestoreService } from '@/services/webrtc';
import { WEBRTC_ACTIONS } from 'pkg-utils';
import { getClients } from '@/services/shared';
import { storageManager, WEBRTC_STORAGE_KEYS } from '@/stores/storage';

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
     * 开启同步（统一入口）
     * 自动判断是初始化还是恢复会话
     */
    async startSync() {
      try {
        // 1. 检查本地存储是否有 webrtc_peer_id
        const savedPeerId = storageManager.get(WEBRTC_STORAGE_KEYS.PEER_ID);

        if (!savedPeerId) {
          // 情况1：没有 peerId → 需要初始化
          console.log('[MobileSync] 没有保存的 Peer ID，执行初始化');
          await this.initialize();
          return;
        }

        // 情况2：有 peerId
        console.log('[MobileSync] 发现保存的 Peer ID:', savedPeerId);

        // 2. 检查 SharedWorker 是否有可用的 WebRTC 客户端
        try {
          const clients = await getClients();
          const hasWebRTC = clients.some(
            (client) => client.name === WEBRTC_ACTIONS.SHARED_NAME
          );

          if (hasWebRTC) {
            // 情况2a：有连接 → 恢复会话
            console.log('[MobileSync] 检测到 WebRTC 客户端在线，执行恢复');
            await this.restoreSession();
          } else {
            // 情况2b：有 peerId 但连接断了 → 重新初始化
            console.log('[MobileSync] WebRTC 客户端离线，重新初始化');
            await this.initialize();
          }
        } catch (error) {
          // SharedWorker 未连接，需要初始化
          console.log('[MobileSync] SharedWorker 未连接，执行初始化:', error.message);
          await this.initialize();
        }
      } catch (error) {
        console.error('[MobileSync] 启动失败:', error);
        this.status = SYNC_STATUS.ERROR;
        this.errorMessage = error.message;
        throw error;
      }
    },

    /**
     * 初始化 WebRTC
     * 创建新的 Peer 连接
     */
    async initialize() {
      try {
        this.status = SYNC_STATUS.INITIALIZING;
        this.errorMessage = null;

        // 注册全局事件监听（接收来自 WebRTC Service 的事件）
        this.setupEventListeners();

        // 调用 WebRTC Service 初始化
        const result = await initialize();

        console.log('[MobileSync] 初始化完成，Peer ID:', result.peerId);

        // 更新 Store 状态
        this.peerId = result.peerId;
        this.isReady = true;
        this.status = SYNC_STATUS.READY;

        return result;
      } catch (error) {
        console.error('[MobileSync] 初始化失败:', error);
        this.status = SYNC_STATUS.ERROR;
        this.errorMessage = error.message;
        throw error;
      }
    },

    /**
     * 恢复会话（内部方法）
     * 当本地有 peerId 且 Extension 端连接仍存在时调用
     */
    async restoreSession() {
      try {
        console.log('[MobileSync] 恢复会话...');

        this.status = SYNC_STATUS.INITIALIZING;
        this.errorMessage = null;

        // 注册事件监听器
        this.setupEventListeners();

        const result = await tryRestoreService();

        if (result.restored) {
          // 恢复成功，更新状态
          this.peerId = result.peerId;
          this.isReady = true;
          this.status = result.connections.length > 0 ? SYNC_STATUS.CONNECTED : SYNC_STATUS.READY;
          this.connections = result.connections || [];

          console.log('[MobileSync] 会话已恢复, Peer ID:', result.peerId);
          return result;
        }

        throw new Error('恢复失败');
      } catch (error) {
        console.error('[MobileSync] 会话恢复失败:', error);
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
      const { action, type, data, peerId, timestamp } = event.detail;

      console.log('[MobileSync] 处理 WebRTC 消息:', action, { type, data, peerId });

      // 根据 action 分发处理
      switch (action) {
        case WEBRTC_ACTIONS.READY:
          this.handleWebRTCReady(data);
          break;

        case WEBRTC_ACTIONS.ERROR:
          this.handleWebRTCError(data);
          break;

        case WEBRTC_ACTIONS.DATA: // 来自移动端的数据
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
          console.warn('[MobileSync] 未处理的消息 action:', action);
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
