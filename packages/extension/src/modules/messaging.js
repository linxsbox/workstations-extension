// ==================== 消息通信模块 ====================

/**
 * 消息通信管理器
 * 处理 Service Worker 与其他页面/脚本的消息通信
 */
class MessagingManager {
  constructor() {
    this.handlers = new Map();
    this.listeners = [];
  }

  /**
   * 注册消息处理器
   * @param {string} type - 消息类型
   * @param {Function} handler - 处理函数 (message, sender) => response
   */
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }

  /**
   * 注册多个消息处理器
   * @param {Object} handlers - 处理器对象 { type: handler }
   */
  registerHandlers(handlers) {
    Object.entries(handlers).forEach(([type, handler]) => {
      this.registerHandler(type, handler);
    });
  }

  /**
   * 移除消息处理器
   * @param {string} type - 消息类型
   */
  unregisterHandler(type) {
    this.handlers.delete(type);
  }

  /**
   * 设置全局消息监听器
   * 自动路由到对应的处理器
   */
  setupListener() {
    const listener = (message, sender, sendResponse) => {
      const { type } = message;

      if (!type) {
        console.warn('[Messaging] 收到无类型的消息:', message);
        return false;
      }

      const handler = this.handlers.get(type);

      if (handler) {
        try {
          const response = handler(message, sender);

          // 支持异步处理器
          if (response instanceof Promise) {
            response
              .then((result) => sendResponse({ success: true, data: result }))
              .catch((error) => {
                console.error(`[Messaging] 处理 ${type} 失败:`, error);
                sendResponse({ success: false, error: error.message });
              });
            return true; // 异步响应
          } else {
            sendResponse({ success: true, data: response });
            return false;
          }
        } catch (error) {
          console.error(`[Messaging] 处理 ${type} 异常:`, error);
          sendResponse({ success: false, error: error.message });
          return false;
        }
      } else {
        console.warn(`[Messaging] 未找到处理器: ${type}`);
        return false;
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    this.listeners.push(listener);
  }

  /**
   * 发送消息到所有扩展页面
   * @param {Object} message - 消息对象
   * @returns {Promise<void>}
   */
  static async broadcastMessage(message) {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.log('[Messaging] 广播消息失败（可能没有活动页面）:', error.message);
    }
  }

  /**
   * 发送消息到特定标签页
   * @param {number} tabId - 标签页 ID
   * @param {Object} message - 消息对象
   * @returns {Promise<*>}
   */
  static async sendToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 发送消息到所有标签页
   * @param {Object} message - 消息对象
   * @returns {Promise<void>}
   */
  static async sendToAllTabs(message) {
    const tabs = await chrome.tabs.query({});
    const promises = tabs.map((tab) =>
      MessagingManager.sendToTab(tab.id, message).catch(() => {
        // 忽略发送失败的标签页
      })
    );
    await Promise.all(promises);
  }

  /**
   * 清理监听器
   */
  cleanup() {
    this.listeners.forEach((listener) => {
      chrome.runtime.onMessage.removeListener(listener);
    });
    this.listeners = [];
    this.handlers.clear();
  }
}

export default MessagingManager;
