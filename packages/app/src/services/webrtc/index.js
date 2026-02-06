/**
 * WebRTC Service - App 端
 *
 * 职责：
 * 1. 按需初始化 SharedWorker 客户端
 * 2. 监听来自 Extension WebRTC 模块的消息
 * 3. 提供 API 供 UI 层调用
 */

import { initSharedClient, onMessage, sendTo } from '../shared';
import {
  WEBRTC_ACTIONS,
  APP_ACTIONS,
  SERVICE_NAME,
  MessageBuilder,
} from 'pkg-utils';
import { Logger } from '@linxs/toolkit';

const logger = new Logger('WebRTC Service');

/**
 * WebRTC 服务类
 *
 * 注意：这个类不直接管理 WebRTC 连接
 * WebRTC 连接由 Extension 端管理，这里只是通信桥接
 */
export class WebRTCService {
  constructor() {
    this.initialized = false;
    // 创建消息构建器
    this.messageBuilder = MessageBuilder.create({
      from: APP_ACTIONS.MODULE_NAME,
      service: SERVICE_NAME.OFFSCREEN,
    });
  }

  /**
   * 初始化 WebRTC
   *
   * 新流程：
   * 1. 注册 chrome.runtime.onMessage 监听器（等待 READY）
   * 2. 发送 INIT 给 Extension 端
   * 3. 返回 Promise（由 READY 消息 resolve）
   */
  async initialize() {
    if (this.initialized) {
      return { peerId: this._peerId };
    }

    try {
      // 步骤 1: 注册 chrome.runtime.onMessage 监听 READY
      this.setupRuntimeMessageHandler();

      // 步骤 2: 发送 INIT 给 Extension (使用原有格式)
      const message = this.messageBuilder.send({
        to: WEBRTC_ACTIONS.MODULE_NAME,
        action: WEBRTC_ACTIONS.INIT,
      });

      await chrome.runtime.sendMessage(message);

      // 步骤 3: 等待 READY 消息
      return new Promise((resolve, reject) => {
        this._initResolve = resolve;
        this._initReject = reject;

        // 30秒超时
        this._initTimeout = setTimeout(() => {
          this._initResolve = null;
          this._initReject = null;
          reject(new Error('初始化超时'));
        }, 30000);
      });
    } catch (error) {
      logger.error('初始化失败:', error);
      throw error;
    }
  }

  /**
   * 注册 chrome.runtime.onMessage 处理器（监听 READY）
   */
  setupRuntimeMessageHandler() {
    if (this._runtimeMessageHandlerSetup) {
      return;
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // 检查是否是 WebRTC 模块的消息
      if (message.to !== APP_ACTIONS.MODULE_NAME) {
        return;
      }

      if (message.from !== WEBRTC_ACTIONS.MODULE_NAME) {
        return;
      }

      // 处理 READY 消息
      if (message.action === WEBRTC_ACTIONS.READY) {
        this.handleReady(message.data);
      }
    });

    this._runtimeMessageHandlerSetup = true;
  }

  /**
   * 处理 READY 消息
   */
  async handleReady(data) {
    logger.info('收到 READY 消息, Peer ID:', data.peerId);

    try {
      // 保存 peerId
      this._peerId = data.peerId;

      // 初始化 SharedClient
      await initSharedClient(APP_ACTIONS.SHARED_NAME);

      // 注册 SharedWorker 消息监听器
      this.setupSharedWorkerMessageHandlers();

      this.initialized = true;

      // resolve 初始化 Promise
      if (this._initResolve) {
        clearTimeout(this._initTimeout);
        this._initResolve({ peerId: data.peerId });
        this._initResolve = null;
        this._initReject = null;
        this._initTimeout = null;
      }
    } catch (error) {
      logger.error('处理 READY 失败:', error);
      if (this._initReject) {
        clearTimeout(this._initTimeout);
        this._initReject(error);
        this._initResolve = null;
        this._initReject = null;
        this._initTimeout = null;
      }
    }
  }

  /**
   * 注册 SharedWorker 消息处理器
   */
  setupSharedWorkerMessageHandlers() {
    onMessage(WEBRTC_ACTIONS.MODULE_NAME, (message, from) => {
      // 通过自定义事件分发给 Store
      // 消息格式：{ from, to, action, type, data, peerId, timestamp }
      window.dispatchEvent(
        new CustomEvent('webrtc-message', {
          detail: {
            action: message.action,
            type: message.type,
            data: message.data,
            peerId: message.peerId,
            timestamp: message.timestamp,
          },
        })
      );
    });
  }

  /**
   * 获取状态
   */
  async getStatus() {
    if (!this.initialized) {
      throw new Error('WebRTC Service 未初始化');
    }

    try {
      const response = await sendTo(WEBRTC_ACTIONS.MODULE_NAME, {
        type: 'GET_STATUS',
      });
      return response;
    } catch (error) {
      logger.error('获取状态失败:', error);
      throw error;
    }
  }

  /**
   * 尝试恢复之前的会话
   * 在 App 启动时调用
   */
  async tryRestore() {
    try {
      // 1. 检查本地存储是否有 peer_id
      const result = await chrome.storage.local.get('webrtc_peer_id');
      if (!result || !result.webrtc_peer_id) {
        logger.info('未找到已保存的 Peer ID，跳过会话恢复');
        return { restored: false };
      }

      logger.info('找到已保存的 Peer ID:', result.webrtc_peer_id);

      // 2. 查询 Extension WebRTC 状态 (使用原有格式)
      const message = this.messageBuilder.send({
        to: WEBRTC_ACTIONS.MODULE_NAME,
        action: WEBRTC_ACTIONS.GET_STATUS,
      });

      const response = await chrome.runtime.sendMessage(message);

      // 3. 检查状态
      // Extension 返回格式: { success: true, status: { peerId, connected, destroyed, connections } }
      if (response.success && response.status && response.status.peerId) {
        logger.info('Extension WebRTC 仍在运行，准备恢复会话');
        // Extension 的 Peer 还在运行
        this._peerId = response.status.peerId;

        // 4. 恢复 SharedClient 连接
        logger.info('初始化 SharedClient 连接...');
        await initSharedClient(APP_ACTIONS.SHARED_NAME);
        this.setupSharedWorkerMessageHandlers();
        this.setupRuntimeMessageHandler();

        this.initialized = true;

        logger.info('会话恢复成功');
        return {
          restored: true,
          peerId: response.status.peerId,
          connections: response.status.connections || [],
        };
      }

      // Extension 的 Peer 已经关闭，清除本地存储
      logger.info('Extension WebRTC 已关闭，清除本地存储');
      await chrome.storage.local.remove('webrtc_peer_id');
      return { restored: false };
    } catch (error) {
      logger.error('会话恢复失败:', error);
      // 清除可能已损坏的数据
      try {
        await chrome.storage.local.remove('webrtc_peer_id');
      } catch (e) {
        // 忽略清除失败
      }
      return { restored: false, error: error.message };
    }
  }
}

// 创建单例实例
export const webrtcService = new WebRTCService();

// 导出便捷方法
export const initialize = () => webrtcService.initialize();
export const getStatus = () => webrtcService.getStatus();
export const tryRestore = () => webrtcService.tryRestore();
