/**
 * WebRTC 消息处理器
 * 处理来自前端或其他模块的 WebRTC 相关消息
 */

import ChromeStorage from '../../modules/storage.js';
import {
  createOffscreenDocument,
  waitForOffscreenReady,
  forwardToOffscreen,
  broadcastWebRTCData,
  enableAutoRestore,
  disableAutoRestore
} from '../../modules/webrtc.js';
import { executeHandler } from '../../modules/webrtc-handlers.js';

class WebRTCHandler {
  /**
   * 统一处理 WebRTC 消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>}
   */
  static async handle(message) {
    const { action, data } = message;

    console.log(`[WebRTC Handler] 处理动作: ${action}`);

    switch (action) {
      case 'INIT':
        return this.handleInit(data);

      case 'GET_PEER_ID':
        return this.handleGetPeerId(data);

      case 'SAVE_PEER_ID':
        return this.handleSavePeerId(data);

      case 'MESSAGE':
        return this.handleMessage(data);

      case 'ENABLE_AUTO_RESTORE':
        return this.handleEnableAutoRestore(data);

      case 'DISABLE_AUTO_RESTORE':
        return this.handleDisableAutoRestore(data);

      case 'COMPLETE_RESET':
        return this.handleCompleteReset(data);

      case 'SEND_DATA':
        return this.handleSendData(data);

      case 'DISCONNECT':
        return this.handleDisconnect(data);

      case 'SHUTDOWN':
        return this.handleShutdown(data);

      case 'RESET':
        return this.handleReset(data);

      default:
        console.warn(`[WebRTC Handler] 未知动作: ${action}`);
        return { success: false, error: `未知的动作: ${action}` };
    }
  }

  /**
   * 初始化 WebRTC
   */
  static async handleInit(data) {
    console.log('[WebRTC Handler] 初始化 WebRTC');

    // 检查 Offscreen Document 是否已存在
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
      console.log('[WebRTC Handler] Offscreen Document 已存在，发送初始化消息');
      // 如果已存在，直接发送初始化消息
      const response = await forwardToOffscreen({ type: 'WEBRTC_INIT' });
      return response;
    }

    // 如果不存在，创建新的 Offscreen Document
    console.log('[WebRTC Handler] 创建 Offscreen Document...');
    const success = await createOffscreenDocument();

    if (!success) {
      return { success: false, error: '创建 Offscreen Document 失败' };
    }

    // 等待 Offscreen Document 就绪通知
    console.log('[WebRTC Handler] 等待 Offscreen 就绪...');
    const ready = await waitForOffscreenReady();

    if (!ready) {
      return { success: false, error: 'Offscreen Document 就绪超时' };
    }

    // 发送初始化消息
    console.log('[WebRTC Handler] 发送初始化消息到 Offscreen');
    const response = await forwardToOffscreen({ type: 'WEBRTC_INIT' });
    return response;
  }

  /**
   * 获取 Peer ID
   */
  static async handleGetPeerId(data) {
    console.log('[WebRTC Handler] 获取 Peer ID');
    const peerId = await ChromeStorage.getLocal('webrtc_peer_id', null);
    return { peerId };
  }

  /**
   * 保存 Peer ID
   */
  static async handleSavePeerId(data) {
    console.log('[WebRTC Handler] 保存 Peer ID:', data.peerId);
    await ChromeStorage.setLocal('webrtc_peer_id', data.peerId);
    return { success: true };
  }

  /**
   * 处理 WebRTC 通用消息
   */
  static async handleMessage(data) {
    console.log('[WebRTC Handler] 收到 WebRTC 消息:', data);

    if (!data || !data.type) {
      return {
        success: false,
        error: '无效的消息格式'
      };
    }

    // 执行对应的处理器
    const result = await executeHandler(data.type, data);

    // 广播数据到前端（如果需要）
    if (result.success && data.broadcast !== false) {
      await broadcastWebRTCData({
        type: data.type,
        data: result.data,
        timestamp: data.timestamp || Date.now()
      });
    }

    return result;
  }

  /**
   * 启用自动恢复
   */
  static async handleEnableAutoRestore(data) {
    console.log('[WebRTC Handler] 启用自动恢复');
    await enableAutoRestore();
    return { success: true };
  }

  /**
   * 禁用自动恢复
   */
  static async handleDisableAutoRestore(data) {
    console.log('[WebRTC Handler] 禁用自动恢复');
    await disableAutoRestore();
    return { success: true };
  }

  /**
   * 完全重置 WebRTC
   */
  static async handleCompleteReset(data) {
    console.log('[WebRTC Handler] 完全重置 WebRTC');

    // 清除所有数据
    await ChromeStorage.remove('webrtc_peer_id');
    await ChromeStorage.remove('webrtc_auto_restore');
    await ChromeStorage.remove('webrtc_status');
    await ChromeStorage.remove('webrtc_error');

    // 关闭 Offscreen Document
    try {
      await chrome.offscreen.closeDocument();
    } catch (error) {
      console.log('[WebRTC Handler] Offscreen 可能已关闭');
    }

    return { success: true };
  }

  /**
   * 发送数据到手机
   */
  static async handleSendData(data) {
    console.log('[WebRTC Handler] 转发数据到 Offscreen');
    const response = await forwardToOffscreen({ type: 'WEBRTC_SEND_DATA', data: data.data });
    return response;
  }

  /**
   * 断开连接
   */
  static async handleDisconnect(data) {
    console.log('[WebRTC Handler] 断开 WebRTC 连接');
    const response = await forwardToOffscreen({ type: 'WEBRTC_DISCONNECT' });
    return response;
  }

  /**
   * 完全关闭
   */
  static async handleShutdown(data) {
    console.log('[WebRTC Handler] 完全关闭 WebRTC');

    // 转发到 Offscreen
    const response = await forwardToOffscreen({ type: 'WEBRTC_SHUTDOWN' });

    // 禁用自动恢复
    await disableAutoRestore();

    // 关闭 Offscreen Document
    try {
      await chrome.offscreen.closeDocument();
      console.log('[WebRTC Handler] Offscreen Document 已关闭');
    } catch (error) {
      console.log('[WebRTC Handler] Offscreen 可能已关闭:', error.message);
    }

    return response;
  }

  /**
   * 重置连接
   */
  static async handleReset(data) {
    console.log('[WebRTC Handler] 重置 WebRTC');
    const response = await forwardToOffscreen({ type: 'WEBRTC_RESET' });
    return response;
  }
}

export default WebRTCHandler;
