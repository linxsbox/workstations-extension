/**
 * 移动端同步 Store
 * 管理 WebRTC 连接状态和接收到的数据
 */

import { defineStore } from 'pinia';
import webrtcService from '@/services/webrtc';
import { CONNECTION_STATUS } from '@/services/webrtc/constants';
import { storeNotes } from '@/stores/miniapps/notes';
import { storeApp } from '@/stores/global/app';

export const storeMobileSync = defineStore('mobileSync', {
  state: () => ({
    // Peer ID
    peerId: null,

    // 连接状态
    status: CONNECTION_STATUS.IDLE,

    // 是否显示二维码弹窗
    showQRDialog: false,

    // 已连接设备数
    connectedDevices: 0,

    // 接收到的笔记列表
    receivedNotes: [],

    // 错误信息
    error: null,

    // 状态监听器
    statusUnsubscribe: null,
    dataUnsubscribe: null,

    // Service Worker 事件取消订阅函数列表
    swEventUnsubscribers: [],
  }),

  getters: {
    // 是否已连接
    isConnected: (state) => state.status === CONNECTION_STATUS.CONNECTED,

    // 是否就绪
    isReady: (state) => state.status === CONNECTION_STATUS.READY,

    // 是否有错误
    hasError: (state) => state.status === CONNECTION_STATUS.ERROR,

    // 动态生成 QR URL
    qrUrl: (state) => {
      if (!state.peerId) return null;
      // 硬编码本地 IP 用于测试
      return `http://172.17.4.102:5500/mobile-demo.html?peer=${state.peerId}`;
    },

    // 状态文本
    statusText: (state) => {
      const statusMap = {
        [CONNECTION_STATUS.IDLE]: '未初始化',
        [CONNECTION_STATUS.INITIALIZING]: '初始化中...',
        [CONNECTION_STATUS.READY]: '等待连接',
        [CONNECTION_STATUS.CONNECTING]: '连接中...',
        [CONNECTION_STATUS.CONNECTED]: '已连接',
        [CONNECTION_STATUS.DISCONNECTED]: '已断开',
        [CONNECTION_STATUS.ERROR]: '连接错误',
      };

      return statusMap[state.status] || '未知状态';
    },
  },

  actions: {
    /**
     * 初始化 WebRTC
     */
    async initWebRTC() {
      try {
        this.status = CONNECTION_STATUS.INITIALIZING;
        this.error = null;

        // 清理旧的订阅（避免重复订阅）
        this.swEventUnsubscribers.forEach(unsub => unsub());
        this.swEventUnsubscribers = [];

        if (this.statusUnsubscribe) {
          this.statusUnsubscribe();
          this.statusUnsubscribe = null;
        }

        if (this.dataUnsubscribe) {
          this.dataUnsubscribe();
          this.dataUnsubscribe = null;
        }

        // 初始化事件总线订阅
        this.setupServiceWorkerEventListeners();

        // 初始化 WebRTC 服务
        const success = await webrtcService.init();

        if (!success) {
          throw new Error('WebRTC 初始化失败');
        }

        // 监听状态变化
        this.setupListeners();

        console.log('[Mobile Sync Store] 初始化成功');
        return true;
      } catch (error) {
        console.error('[Mobile Sync Store] 初始化失败:', error);
        this.status = CONNECTION_STATUS.ERROR;
        this.error = error.message;
        return false;
      }
    },

    /**
     * 设置 Service Worker 事件监听器
     */
    setupServiceWorkerEventListeners() {
      const appStore = storeApp();

      // 确保事件总线已初始化
      appStore.initServiceWorkerEventBus();

      // 订阅 WEBRTC_READY 事件
      const unsubReady = appStore.onServiceWorkerEvent('WEBRTC_READY', (message) => {
        console.log('[Mobile Sync Store] 收到 WEBRTC_READY:', message.peerId);
        this.peerId = message.peerId;
        this.status = message.status || CONNECTION_STATUS.READY;

        // 通知 WebRTC Service 设置 Peer ID
        webrtcService.setPeerId(message.peerId);
      });

      // 订阅 WEBRTC_CONNECTED 事件
      const unsubConnected = appStore.onServiceWorkerEvent('WEBRTC_CONNECTED', (message) => {
        console.log('[Mobile Sync Store] 收到 WEBRTC_CONNECTED');
        this.status = CONNECTION_STATUS.CONNECTED;
        this.connectedDevices = message.connectedDevices || 1;
      });

      // 订阅 WEBRTC_DISCONNECTED 事件
      const unsubDisconnected = appStore.onServiceWorkerEvent('WEBRTC_DISCONNECTED', (message) => {
        console.log('[Mobile Sync Store] 收到 WEBRTC_DISCONNECTED');
        this.status = CONNECTION_STATUS.DISCONNECTED;
        this.connectedDevices = 0;
      });

      // 订阅 WEBRTC_ERROR 事件
      const unsubError = appStore.onServiceWorkerEvent('WEBRTC_ERROR', (message) => {
        console.error('[Mobile Sync Store] 收到 WEBRTC_ERROR:', message.error);
        this.status = CONNECTION_STATUS.ERROR;
        this.error = message.error;
      });

      // 订阅 WEBRTC_DATA_RECEIVED 事件
      const unsubData = appStore.onServiceWorkerEvent('WEBRTC_DATA_RECEIVED', (message) => {
        console.log('[Mobile Sync Store] 收到 WEBRTC_DATA_RECEIVED:', message.data);
        this.handleReceivedData(message.data);
      });

      // 保存所有取消订阅函数
      this.swEventUnsubscribers.push(
        unsubReady,
        unsubConnected,
        unsubDisconnected,
        unsubError,
        unsubData
      );

      console.log('[Mobile Sync Store] 已订阅所有 Service Worker 事件');
    },

    /**
     * 设置监听器
     */
    setupListeners() {
      // 监听状态变化
      if (this.statusUnsubscribe) {
        this.statusUnsubscribe();
      }

      this.statusUnsubscribe = webrtcService.onStatusChange((newStatus) => {
        console.log('[Mobile Sync Store] 状态变化:', newStatus);
        this.status = newStatus;
      });

      // 监听数据接收
      if (this.dataUnsubscribe) {
        this.dataUnsubscribe();
      }

      this.dataUnsubscribe = webrtcService.onDataReceived((data) => {
        console.log('[Mobile Sync Store] 收到数据:', data);
        this.handleReceivedData(data);
      });
    },

    /**
     * 处理接收到的数据
     */
    handleReceivedData(data) {
      if (!data || !data.type) {
        console.warn('[Mobile Sync Store] 无效的数据格式');
        return;
      }

      switch (data.type) {
        case 'NOTE':
          this.handleReceivedNote(data);
          break;

        default:
          console.warn('[Mobile Sync Store] 未知的数据类型:', data.type);
      }
    },

    /**
     * 处理接收到的笔记
     */
    async handleReceivedNote(data) {
      try {
        const notesStore = storeNotes();

        // 创建新笔记
        const newNote = {
          title: data.title || '来自手机的笔记',
          content: data.content || '',
          source: 'mobile',
          synced: true,
        };

        // 添加到笔记列表
        await notesStore.createNote(newNote);

        // 添加到接收记录
        this.receivedNotes.unshift({
          ...newNote,
          timestamp: data.timestamp || Date.now(),
        });

        console.log('[Mobile Sync Store] 笔记已保存');
      } catch (error) {
        console.error('[Mobile Sync Store] 保存笔记失败:', error);
      }
    },

    /**
     * 注册二维码就绪回调
     */
    onQRReady(callback) {
      this.qrReadyCallback = callback;
    },

    /**
     * 打开二维码弹窗（不初始化 WebRTC）
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

    /**
     * 停止同步
     */
    async stopSync() {
      try {
        // 断开连接
        await webrtcService.disconnect();

        // 取消所有 Service Worker 事件订阅
        this.swEventUnsubscribers.forEach(unsub => unsub());
        this.swEventUnsubscribers = [];

        // 取消 WebRTC Service 监听器
        if (this.statusUnsubscribe) {
          this.statusUnsubscribe();
          this.statusUnsubscribe = null;
        }

        if (this.dataUnsubscribe) {
          this.dataUnsubscribe();
          this.dataUnsubscribe = null;
        }

        // 重置状态
        this.status = CONNECTION_STATUS.IDLE;
        this.peerId = null;
        this.connectedDevices = 0;
        this.error = null;

        console.log('[Mobile Sync Store] 同步已停止');
      } catch (error) {
        console.error('[Mobile Sync Store] 停止同步失败:', error);
        this.error = error.message;
      }
    },

    /**
     * 刷新二维码
     */
    async refreshQRCode() {
      try {
        this.status = CONNECTION_STATUS.INITIALIZING;

        // 重置连接
        await webrtcService.reset();

        // 重新初始化
        await this.initWebRTC();

        console.log('[Mobile Sync Store] 二维码已刷新');
      } catch (error) {
        console.error('[Mobile Sync Store] 刷新失败:', error);
        this.status = CONNECTION_STATUS.ERROR;
        this.error = error.message;
      }
    },

    /**
     * 发送数据到手机
     */
    async sendToMobile(data) {
      if (!this.isConnected) {
        console.warn('[Mobile Sync Store] 未连接到手机');
        return false;
      }

      return await webrtcService.sendToMobile(data);
    },

    /**
     * 清理资源
     */
    cleanup() {
      // 取消所有 Service Worker 事件订阅
      this.swEventUnsubscribers.forEach(unsub => unsub());
      this.swEventUnsubscribers = [];

      // 取消 WebRTC Service 监听器
      if (this.statusUnsubscribe) {
        this.statusUnsubscribe();
        this.statusUnsubscribe = null;
      }

      if (this.dataUnsubscribe) {
        this.dataUnsubscribe();
        this.dataUnsubscribe = null;
      }

      webrtcService.destroy();

      console.log('[Mobile Sync Store] 已清理所有资源');
    },
  },
});
