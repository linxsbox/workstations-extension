import { Logger } from '@linxs/toolkit';
const logger = new Logger('Messaging');

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
   * @param {string} service - 服务类型
   * @param {Function} handler - 处理函数 (message, sender) => response
   */
  registerHandler(service, handler) {
    this.handlers.set(service, handler);
  }

  /**
   * 注册多个消息处理器
   * @param {Object} handlers - 处理器对象 { service: handler }
   */
  registerHandlers(handlers) {
    Object.entries(handlers).forEach(([service, handler]) => {
      this.registerHandler(service, handler);
    });
  }

  /**
   * 移除消息处理器
   * @param {string} service - 服务类型
   */
  unregisterHandler(service) {
    this.handlers.delete(service);
  }

  /**
   * 设置全局消息监听器
   * 自动路由到对应的处理器
   * 消息格式：{ from, to, action, data, timestamp }
   */
  setupListener() {
    const listener = (message, sender, sendResponse) => {
      // 解析消息格式
      const { from, to, action, data, timestamp, service } = message;

      if (!action && !service) {
        logger.warn('收到无效消息:', message);
        return false;
      }

      // 没找到 handler 直接返回
      const handler = this.handlers.get(service);
      if (!handler) {
        return false;
      }

      const messageInfo = {
        from,
        to,
        action,
        data,
        timestamp,
        service,
        sender: sender.id,
      };

      // 记录消息信息
      logger.info('收到消息:', messageInfo);

      // 处理消息
      try {
        // 传递完整的消息信息给处理器
        const response = handler(messageInfo, sender);

        // 支持异步处理器
        if (response instanceof Promise) {
          response
            .then((result) => sendResponse({ success: true, data: result }))
            .catch((error) => {
              logger.error(`处理 ${action} 失败:`, error);
              sendResponse({ success: false, error: error.message });
            });
          return true; // 异步响应
        } else {
          sendResponse({ success: true, data: response });
          return false;
        }
      } catch (error) {
        logger.error(`处理 ${action} 异常:`, error);
        sendResponse({ success: false, error: error.message });
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
      logger.info(
        '广播消息失败（可能没有活动页面）:',
        error.message
      );
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
