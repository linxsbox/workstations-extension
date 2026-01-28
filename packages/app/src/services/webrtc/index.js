/**
 * WebRTC Service - App 端
 *
 * 职责：
 * 1. 监听来自 Extension WebRTC 模块的 chrome.runtime.sendMessage 通知
 * 2. 当 WebRTC 就绪时，初始化 SharedWorker 客户端
 * 3. 提供 API 供 UI 层调用，通过 SharedWorker 与 Extension WebRTC 模块通信
 */

import { initSharedClient, sendTo, onMessage } from '../shared';
import { WEBRTC_ACTIONS } from 'pkg-utils/constants';

/**
 * WebRTC 服务类
 *
 * 注意：这个类不直接管理 WebRTC 连接
 * WebRTC 连接由 Extension 端管理，这里只是通信桥接
 */
export class WebRTCService {
  constructor() {
    this.peerId = null;
    this.isReady = false;
    this.sharedClientInitialized = false;

    this.listeners = {
      ready: [],
      data: [],
      error: [],
      connectionChange: []
    };

    // 监听来自 Extension 的消息
    this.setupChromeMessageListener();
  }

  /**
   * 设置 chrome.runtime.onMessage 监听器
   * 接收来自 Extension WebRTC 模块的通知
   */
  setupChromeMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 只处理 WEBRTC 模块的消息
      if (message.module !== WEBRTC_ACTIONS.MODULE_NAME) {
        return;
      }

      console.log('[WebRTC Service] 收到 Extension 消息:', message);

      const { action, data } = message;

      switch (action) {
        case WEBRTC_ACTIONS.READY:
          this.handleReady(data);
          break;

        case WEBRTC_ACTIONS.ERROR:
          this.handleError(data);
          break;

        default:
          console.warn('[WebRTC Service] 未知的 action:', action);
      }

      // 返回响应
      sendResponse({ received: true });
    });

    console.log('[WebRTC Service] chrome.runtime.onMessage 监听器已设置');
  }

  /**
   * 处理 WebRTC 就绪事件
   *
   * 流程：
   * 1. Extension WebRTC 初始化完成
   * 2. 通过 chrome.runtime.sendMessage 通知 App
   * 3. App 初始化 SharedWorker 客户端
   * 4. 开始监听来自 Extension 的 SharedWorker 消息
   */
  async handleReady(data) {
    console.log('[WebRTC Service] WebRTC 已就绪:', data);

    this.peerId = data.peerId;
    this.isReady = true;

    // 初始化 SharedWorker 客户端（如果还没初始化）
    if (!this.sharedClientInitialized) {
      await this.initializeSharedClient();
    }

    // 触发就绪监听器
    this.listeners.ready.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[WebRTC Service] Ready 监听器错误:', error);
      }
    });
  }

  /**
   * 初始化 SharedWorker 客户端
   */
  async initializeSharedClient() {
    try {
      console.log('[WebRTC Service] 初始化 SharedWorker 客户端...');

      // 初始化 SharedClient（如果还没初始化）
      await initSharedClient('SHARED_APP');

      // 注册消息处理器，监听来自 Extension WebRTC 模块的消息
      this.setupSharedWorkerMessageHandlers();

      this.sharedClientInitialized = true;

      console.log('[WebRTC Service] SharedWorker 客户端初始化完成');
    } catch (error) {
      console.error('[WebRTC Service] SharedWorker 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置 SharedWorker 消息处理器
   * 监听来自 Extension WebRTC 模块通过 SharedWorker 发送的消息
   */
  setupSharedWorkerMessageHandlers() {
    // 监听来自 Extension WebRTC 模块的消息
    // Extension 在收到 P2P 数据后，通过 SharedWorker 转发给 App
    onMessage(WEBRTC_ACTIONS.MODULE_NAME, (data, from) => {
      console.log('[WebRTC Service] 收到 SharedWorker 消息:', data, '来自:', from);

      // data 是从其他设备通过 WebRTC P2P 传来的数据
      this.handleData(data);

      return { received: true };
    });
  }

  /**
   * 处理接收到的 P2P 数据
   * 这些数据是从其他设备通过 WebRTC 传来的
   */
  handleData(data) {
    console.log('[WebRTC Service] 收到 P2P 数据:', data);

    // 触发数据监听器
    this.listeners.data.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[WebRTC Service] Data 监听器错误:', error);
      }
    });
  }

  /**
   * 处理错误
   */
  handleError(error) {
    console.error('[WebRTC Service] 错误:', error);

    this.listeners.error.forEach(listener => {
      try {
        listener(error);
      } catch (error) {
        console.error('[WebRTC Service] Error 监听器错误:', error);
      }
    });
  }

  /**
   * 获取 Peer ID
   *
   * 通过 SharedWorker 向 Extension WebRTC 模块请求
   */
  async getPeerId() {
    if (!this.sharedClientInitialized) {
      throw new Error('SharedWorker 客户端未初始化');
    }

    try {
      const response = await sendTo(WEBRTC_ACTIONS.MODULE_NAME, {
        action: WEBRTC_ACTIONS.GET_PEER_ID
      });

      if (response.success) {
        this.peerId = response.peerId;
        return response.peerId;
      }

      return null;
    } catch (error) {
      console.error('[WebRTC Service] 获取 Peer ID 失败:', error);
      throw error;
    }
  }

  /**
   * 获取 WebRTC 状态
   *
   * 通过 SharedWorker 向 Extension WebRTC 模块请求
   */
  async getStatus() {
    if (!this.sharedClientInitialized) {
      throw new Error('SharedWorker 客户端未初始化');
    }

    try {
      const response = await sendTo(WEBRTC_ACTIONS.MODULE_NAME, {
        action: WEBRTC_ACTIONS.GET_STATUS
      });

      if (response.success) {
        const { status } = response;
        this.peerId = status.peerId;
        this.isReady = status.connected;

        // 触发连接变化监听器
        this.listeners.connectionChange.forEach(listener => {
          try {
            listener(status);
          } catch (error) {
            console.error('[WebRTC Service] ConnectionChange 监听器错误:', error);
          }
        });

        return status;
      }

      return null;
    } catch (error) {
      console.error('[WebRTC Service] 获取状态失败:', error);
      throw error;
    }
  }

  /**
   * 发送数据到指定 Peer
   *
   * 通过 SharedWorker 发送给 Extension WebRTC 模块
   * Extension WebRTC 模块再通过 P2P 发送给目标设备
   */
  async sendData(targetPeerId, data) {
    if (!this.sharedClientInitialized) {
      throw new Error('SharedWorker 客户端未初始化');
    }

    try {
      const response = await sendTo(WEBRTC_ACTIONS.MODULE_NAME, {
        action: WEBRTC_ACTIONS.SEND_DATA,
        data: {
          targetPeerId,
          data
        }
      });

      return response;
    } catch (error) {
      console.error('[WebRTC Service] 发送数据失败:', error);
      throw error;
    }
  }

  /**
   * 断开 WebRTC 连接
   *
   * 通过 SharedWorker 通知 Extension WebRTC 模块断开
   */
  async disconnect() {
    if (!this.sharedClientInitialized) {
      throw new Error('SharedWorker 客户端未初始化');
    }

    try {
      const response = await sendTo(WEBRTC_ACTIONS.MODULE_NAME, {
        action: WEBRTC_ACTIONS.DISCONNECT
      });

      if (response.success) {
        this.isReady = false;
      }

      return response;
    } catch (error) {
      console.error('[WebRTC Service] 断开连接失败:', error);
      throw error;
    }
  }

  /**
   * 注册事件监听器
   */
  on(event, listener) {
    if (this.listeners[event]) {
      this.listeners[event].push(listener);
    } else {
      console.warn(`[WebRTC Service] 未知的事件类型: ${event}`);
    }
  }

  /**
   * 移除事件监听器
   */
  off(event, listener) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(listener);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus() {
    return {
      peerId: this.peerId,
      isReady: this.isReady,
      sharedClientInitialized: this.sharedClientInitialized,
      listenerCounts: {
        ready: this.listeners.ready.length,
        data: this.listeners.data.length,
        error: this.listeners.error.length,
        connectionChange: this.listeners.connectionChange.length
      }
    };
  }
}

// 创建单例实例
export const webrtcService = new WebRTCService();

// 导出便捷方法
export const getPeerId = () => webrtcService.getPeerId();
export const getStatus = () => webrtcService.getStatus();
export const sendData = (targetPeerId, data) => webrtcService.sendData(targetPeerId, data);
export const disconnect = () => webrtcService.disconnect();
export const onWebRTCReady = (listener) => webrtcService.on('ready', listener);
export const onWebRTCData = (listener) => webrtcService.on('data', listener);
export const onWebRTCError = (listener) => webrtcService.on('error', listener);
export const onWebRTCConnectionChange = (listener) => webrtcService.on('connectionChange', listener);
