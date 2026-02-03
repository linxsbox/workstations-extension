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
  createMessageBuilder,
} from 'pkg-utils';
import { Logger } from '@linxs/toolkit';

// 创建消息构建器
const messageBuilder = createMessageBuilder(APP_ACTIONS.MODULE_NAME);
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
      logger.info('已初始化，跳过');
      return { peerId: this._peerId };
    }

    try {
      logger.info('开始初始化...');

      // 步骤 1: 注册 chrome.runtime.onMessage 监听 READY
      this.setupRuntimeMessageHandler();

      // 步骤 2: 发送 INIT 给 Extension
      logger.info('发送 INIT 到 Extension...');
      const message = messageBuilder.send({
        service: SERVICE_NAME.OFFSCREEN,
        to: WEBRTC_ACTIONS.MODULE_NAME,
        action: WEBRTC_ACTIONS.INIT,
      });

      await chrome.runtime.sendMessage(message);

      logger.info('INIT 已发送，等待 READY...');

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
    logger.info('chrome.runtime.onMessage 监听器已注册');
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
      logger.info('正在连接 SharedWorker...');
      await initSharedClient(APP_ACTIONS.SHARED_NAME);
      logger.info('SharedClient 已连接');

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
      logger.info('收到 SharedWorker 消息:', message.type, from);

      // 通过自定义事件分发给 Store
      window.dispatchEvent(
        new CustomEvent('webrtc-message', {
          detail: {
            type: message.type,
            data: message.data,
          },
        })
      );
    });

    logger.info('SharedWorker 消息监听器已注册');
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
}

// 创建单例实例
export const webrtcService = new WebRTCService();

// 导出便捷方法
export const initialize = () => webrtcService.initialize();
export const getStatus = () => webrtcService.getStatus();
