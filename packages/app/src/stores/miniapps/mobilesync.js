/**
 * 移动端同步 Store
 * 管理 WebRTC 连接状态和接收到的数据
 */

import { defineStore } from 'pinia';
import webrtcService from '@/services/webrtc';
import { CONNECTION_STATUS } from '@/services/webrtc/constants';
import { storeNotes } from '@/stores/miniapps/notes';

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

        // 初始化 WebRTC 服务
        const success = await webrtcService.init();

        if (!success) {
          throw new Error('WebRTC 初始化失败');
        }

        // 获取 Peer ID
        this.peerId = webrtcService.getPeerId();

        // 获取当前状态
        this.status = await webrtcService.getStatus();

        // 监听状态变化
        this.setupListeners();

        console.log('[Mobile Sync Store] 初始化成功, Peer ID:', this.peerId);
        return true;
      } catch (error) {
        console.error('[Mobile Sync Store] 初始化失败:', error);
        this.status = CONNECTION_STATUS.ERROR;
        this.error = error.message;
        return false;
      }
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
      if (this.statusUnsubscribe) {
        this.statusUnsubscribe();
        this.statusUnsubscribe = null;
      }

      if (this.dataUnsubscribe) {
        this.dataUnsubscribe();
        this.dataUnsubscribe = null;
      }

      webrtcService.destroy();
    },
  },
});
