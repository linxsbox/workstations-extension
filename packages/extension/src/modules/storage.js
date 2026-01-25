// ==================== Chrome Storage 存储模块 ====================

/**
 * Chrome Storage 工具类
 * 提供统一的存储接口，支持 sync 和 local 两种存储方式
 */
class ChromeStorage {
  /**
   * 从 sync 存储中获取值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>}
   */
  static async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key] ?? defaultValue);
      });
    });
  }

  /**
   * 从 local 存储中获取值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>}
   */
  static async getLocal(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] ?? defaultValue);
      });
    });
  }

  /**
   * 设置 sync 存储值
   * @param {string} key - 存储键
   * @param {*} value - 存储值
   * @returns {Promise<void>}
   */
  static async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }

  /**
   * 设置 local 存储值
   * @param {string} key - 存储键
   * @param {*} value - 存储值
   * @returns {Promise<void>}
   */
  static async setLocal(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  /**
   * 批量设置 sync 存储值
   * @param {Object} data - 键值对对象
   * @returns {Promise<void>}
   */
  static async setMultiple(data) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, resolve);
    });
  }

  /**
   * 批量设置 local 存储值
   * @param {Object} data - 键值对对象
   * @returns {Promise<void>}
   */
  static async setMultipleLocal(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  /**
   * 检查并初始化存储值
   * 如果键不存在，则设置为默认值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>}
   */
  static async checkAndInitialize(key, defaultValue) {
    const existingValue = await this.get(key);
    if (existingValue === null) {
      await this.set(key, defaultValue);
      return defaultValue;
    }
    return existingValue;
  }

  /**
   * 检查并初始化 local 存储值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {Promise<*>}
   */
  static async checkAndInitializeLocal(key, defaultValue) {
    const existingValue = await this.getLocal(key);
    if (existingValue === null) {
      await this.setLocal(key, defaultValue);
      return defaultValue;
    }
    return existingValue;
  }

  /**
   * 删除 sync 存储值
   * @param {string} key - 存储键
   * @returns {Promise<void>}
   */
  static async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.sync.remove(key, resolve);
    });
  }

  /**
   * 删除 local 存储值
   * @param {string} key - 存储键
   * @returns {Promise<void>}
   */
  static async removeLocal(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  }

  /**
   * 清空 sync 存储
   * @returns {Promise<void>}
   */
  static async clear() {
    return new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
  }

  /**
   * 清空 local 存储
   * @returns {Promise<void>}
   */
  static async clearLocal() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }

  /**
   * 监听存储变化
   * @param {Function} callback - 回调函数 (changes, namespace) => {}
   */
  static onChanged(callback) {
    chrome.storage.onChanged.addListener(callback);
  }

  /**
   * 移除存储变化监听
   * @param {Function} callback - 回调函数
   */
  static offChanged(callback) {
    chrome.storage.onChanged.removeListener(callback);
  }
}

export default ChromeStorage;
