/**
 * Offscreen Document 消息处理器
 * 处理来自 Offscreen Document 的所有消息
 */

import { handleOffscreenReady } from '../../modules/webrtc.js';

class OffscreenHandler {
  /**
   * 统一处理 Offscreen 消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>}
   */
  static async handle(message) {
    const { action, data } = message;

    console.log(`[Offscreen Handler] 处理动作: ${action}`);

    switch (action) {
      case 'READY':
        return this.handleReady(data);

      case 'ERROR':
        return this.handleError(data);

      default:
        console.warn(`[Offscreen Handler] 未知动作: ${action}`);
        return { success: false, error: `未知的动作: ${action}` };
    }
  }

  /**
   * 处理 Offscreen 就绪通知
   */
  static async handleReady(data) {
    console.log('[Offscreen Handler] Offscreen Document 已就绪');

    // 触发等待者
    handleOffscreenReady();

    return { success: true };
  }

  /**
   * 处理 Offscreen 错误
   */
  static async handleError(data) {
    console.error('[Offscreen Handler] Offscreen 错误:', data.error);

    return { success: true };
  }
}

export default OffscreenHandler;
