/**
 * WebRTC 服务
 * 负责管理 WebRTC 连接和数据传输
 */

import { WEBRTC_CONFIG, CONNECTION_STATUS, SESSION_KEYS, STORAGE_KEYS } from './constants.js';

class WebRTCService {
  constructor() {
    this.isInitialized = false;
    this.listeners = new Map();
  }

  /**
   * 初始化 WebRTC
   * 创建 Offscreen Document 并启动 PeerJS
   */
  async init() {
    if (this.isInitialized) {
      console.log('[WebRTC Service] 已经初始化');
      return true;
    }

    try {
      // 检查是否已有 Peer ID（从 sessionStorage）
      const existingPeerId = sessionStorage.getItem(SESSION_KEYS.PEER_ID);

      if (existingPeerId) {
        console.log('[WebRTC Service] 使用已有的 Peer ID:', existingPeerId);
        this.isInitialized = true;
        return true;
      }

      console.log('[WebRTC Service] 开始初始化...');

      // 设置消息监听器（在发送初始化请求之前）
      const peerIdPromise = this.waitForPeerIdMessage();

      // 通知 Service Worker 初始化 WebRTC
      const response = await chrome.runtime.sendMessage({
        type: 'INIT_WEBRTC'
      });

      console.log('[WebRTC Service] Service Worker 响应:', response);

      if (response?.success) {
        console.log('[WebRTC Service] Offscreen Document 创建成功，等待 Peer ID...');

        // 等待 WEBRTC_READY 消息
        await peerIdPromise;

        this.isInitialized = true;
        return true;
      }

      throw new Error('初始化失败: ' + (response?.error || '未知错误'));
    } catch (error) {
      console.error('[WebRTC Service] 初始化失败:', error);
      return false;
    }
  }

  /**
   * 等待 Peer ID 消息（事件驱动）
   */
  waitForPeerIdMessage(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        chrome.runtime.onMessage.removeListener(messageListener);
        reject(new Error('等待 Peer ID 超时'));
      }, timeout);

      const messageListener = (message, sender, sendResponse) => {
        if (message.type === 'WEBRTC_READY' && message.peerId) {
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(messageListener);

          // 保存 Peer ID 到 sessionStorage
          sessionStorage.setItem(SESSION_KEYS.PEER_ID, message.peerId);

          console.log('[WebRTC Service] 收到 Peer ID:', message.peerId);

          // 保存状态到 sessionStorage
          if (message.status) {
            sessionStorage.setItem('webrtc_status', message.status);
          }

          resolve(message.peerId);
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
    });
  }

  /**
   * 获取当前 Peer ID
   */
  getPeerId() {
    return sessionStorage.getItem(SESSION_KEYS.PEER_ID);
  }

  /**
   * 生成二维码数据
   * 在页面端拼接 URL
   */
  generateQRData() {
    const peerId = this.getPeerId();

    if (!peerId) {
      console.warn('[WebRTC Service] Peer ID 不存在');
      return null;
    }

    // 硬编码本地 IP 用于测试
    const qrData = `http://172.17.4.102:5500/mobile-demo.html?peer=${peerId}`;

    console.log('[WebRTC Service] 生成 QR Data:', qrData);

    return qrData;
  }

  /**
   * 获取连接状态
   */
  async getStatus() {
    try {
      // 优先从 sessionStorage 读取（避免竞态条件）
      const sessionStatus = sessionStorage.getItem('webrtc_status');
      if (sessionStatus) {
        return sessionStatus;
      }

      // 回退到 chrome.storage
      const result = await chrome.storage.local.get([STORAGE_KEYS.WEBRTC_STATUS]);
      return result[STORAGE_KEYS.WEBRTC_STATUS] || CONNECTION_STATUS.IDLE;
    } catch (error) {
      console.error('[WebRTC Service] 获取状态失败:', error);
      return CONNECTION_STATUS.ERROR;
    }
  }

  /**
   * 监听状态变化
   */
  onStatusChange(callback) {
    const listener = (changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.WEBRTC_STATUS]) {
        const newStatus = changes[STORAGE_KEYS.WEBRTC_STATUS].newValue;
        // 同步更新 sessionStorage
        if (newStatus) {
          sessionStorage.setItem('webrtc_status', newStatus);
        }
        callback(newStatus);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    // 返回取消监听的函数
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  /**
   * 监听数据接收
   */
  onDataReceived(callback) {
    const listenerId = `data_${Date.now()}`;
    this.listeners.set(listenerId, callback);

    // 监听来自 Service Worker 的消息
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === 'WEBRTC_DATA_RECEIVED') {
        callback(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listenerId);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }

  /**
   * 发送数据到手机
   */
  async sendToMobile(data) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'WEBRTC_SEND_DATA',
        data: data
      });

      return response?.success || false;
    } catch (error) {
      console.error('[WebRTC Service] 发送数据失败:', error);
      return false;
    }
  }

  /**
   * 断开连接
   */
  async disconnect() {
    try {
      // 通知 Service Worker 断开连接
      await chrome.runtime.sendMessage({
        type: 'WEBRTC_DISCONNECT'
      });

      console.log('[WebRTC Service] 已断开连接');
      return true;
    } catch (error) {
      console.error('[WebRTC Service] 断开连接失败:', error);
      return false;
    }
  }

  /**
   * 重置连接
   */
  async reset() {
    try {
      // 清除 sessionStorage
      sessionStorage.removeItem(SESSION_KEYS.PEER_ID);
      sessionStorage.removeItem(SESSION_KEYS.QR_DATA);
      sessionStorage.removeItem(SESSION_KEYS.CREATED_AT);
      sessionStorage.removeItem('webrtc_status');

      // 通知 Service Worker 重置
      await chrome.runtime.sendMessage({
        type: 'WEBRTC_RESET'
      });

      this.isInitialized = false;

      console.log('[WebRTC Service] 已重置');
      return true;
    } catch (error) {
      console.error('[WebRTC Service] 重置失败:', error);
      return false;
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// 创建单例
const webrtcService = new WebRTCService();

export default webrtcService;
