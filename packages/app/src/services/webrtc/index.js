/**
 * WebRTC Service - App 端
 *
 * 职责：
 * 1. 监听来自 Extension WebRTC 模块的 chrome.runtime.sendMessage 通知
 * 2. 当 WebRTC 就绪时，初始化 SharedWorker 客户端
 * 3. 提供 API 供 UI 层调用，通过 SharedWorker 与 Extension WebRTC 模块通信
 */

import { initSharedClient, sendTo, onMessage } from '../shared';
import {
  WEBRTC_ACTIONS,
  APP_ACTIONS,
  SERVICE_NAME,
  createMessageBuilder,
} from 'pkg-utils';

// 创建消息构建器
const messageBuilder = createMessageBuilder(APP_ACTIONS.MODULE_NAME);

/**
 * WebRTC 服务类
 *
 * 注意：这个类不直接管理 WebRTC 连接
 * WebRTC 连接由 Extension 端管理，这里只是通信桥接
 */
export class WebRTCService {
  constructor() {}

  /**
   * 初始化 WebRTC
   * 发送消息给 Extension 端，请求启动 WebRTC
   */
  async initialize() {
    try {
      console.log('[WebRTC Service] 发送初始化请求到 Extension...');

      // 使用消息构建器创建消息
      const message = messageBuilder.send({
        service: SERVICE_NAME.OFFSCREEN,
        to: WEBRTC_ACTIONS.MODULE_NAME,
        action: WEBRTC_ACTIONS.INIT,
      });

      await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('[WebRTC Service] 初始化失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const webrtcService = new WebRTCService();

// 导出便捷方法
export const initialize = () => webrtcService.initialize();
