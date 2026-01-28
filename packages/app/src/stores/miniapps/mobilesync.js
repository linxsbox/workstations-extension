/**
 * 移动端同步 Store
 * 管理 WebRTC 连接状态和 UI 显示
 */

import { defineStore } from 'pinia';
import {
  webrtcService,
  onWebRTCReady,
  onWebRTCData,
  getPeerId,
  getStatus
} from '@/services/webrtc';

export const storeMobileSync = defineStore('mobileSync', {
  state: () => ({
    // UI 状态
    showQRDialog: false,

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
      return state.connections.map(peerId => ({
        id: peerId,
        name: `设备 ${peerId.slice(-4)}`
      }));
    },

    /**
     * 连接状态文本
     */
    statusText: (state) => {
      if (!state.isReady) return '未初始化';
      if (state.connections.length === 0) return '等待连接';
      return `已连接 ${state.connections.length} 台设备`;
    }
  },

  actions: {
    /**
     * 初始化 Store
     * 在应用启动时调用
     */
    async initialize() {
      console.log('[MobileSync Store] 初始化...');

      // 监听 WebRTC 就绪事件
      onWebRTCReady((data) => {
        console.log('[MobileSync Store] WebRTC 就绪:', data);
        this.peerId = data.peerId;
        this.isReady = true;
      });

      // 监听接收到的数据
      onWebRTCData((data) => {
        console.log('[MobileSync Store] 收到 P2P 数据:', data);
        this.handleReceivedData(data);
      });

      // 获取当前状态（如果 WebRTC 已经就绪）
      try {
        const status = await getStatus();
        if (status) {
          this.peerId = status.peerId;
          this.isReady = status.connected;
          this.connections = status.connections || [];
        }
      } catch (error) {
        console.log('[MobileSync Store] WebRTC 尚未就绪:', error.message);
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

      // 刷新状态
      this.refreshStatus();
    },

    /**
     * 关闭二维码弹窗
     */
    closeQRDialog() {
      this.showQRDialog = false;
    },

    /**
     * 刷新 WebRTC 状态
     */
    async refreshStatus() {
      try {
        const status = await getStatus();
        if (status) {
          this.peerId = status.peerId;
          this.isReady = status.connected;
          this.connections = status.connections || [];
        }
      } catch (error) {
        console.error('[MobileSync Store] 刷新状态失败:', error);
      }
    },

    /**
     * 刷新二维码（重新获取 Peer ID）
     */
    async refreshQRCode() {
      try {
        const peerId = await getPeerId();
        this.peerId = peerId;
        console.log('[MobileSync Store] 二维码已刷新:', peerId);
      } catch (error) {
        console.error('[MobileSync Store] 刷新二维码失败:', error);
      }
    },

    /**
     * 清理资源
     */
    cleanup() {
      // 关闭弹窗
      this.showQRDialog = false;

      // 注意：不要断开 WebRTC 连接
      // WebRTC 连接应该在整个应用生命周期中保持
      console.log('[MobileSync Store] 清理完成');
    }
  }
});
