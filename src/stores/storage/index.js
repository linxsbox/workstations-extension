import { defaultStorage } from "@linxs/toolkit";

const { localStorage, sessionStorage } = defaultStorage();

/**
 * 扩展存储键定义（使用 chrome.storage.local，降级到 localStorage）
 * 这些数据需要跨页面共享、长期保存
 */
export const EXTENSION_STORAGE_KEYS = {
  // 设置相关
  THEME_MODE: "USER_THEME_MODE",
  FONT_SIZE: "USER_FONT_SIZE",

  // 界面状态
  TAB_PREFIX: "USER_TAB_",

  // RSS 相关
  RSS_SOURCES: "USER_RSS_SOURCES",

  // 播放器相关
  VOLUME: "USER_VOLUME",
  PLAYER_PLAY_QUEUE: "PLAYER_PLAY_QUEUE", // 播放队列
  PLAYER_VIEW_MODE: "PLAYER_VIEW_MODE", // 播放器视图模式
  PLAYER_POSITION: "PLAYER_POSITION", // 播放器位置
};

/**
 * 网页存储键定义（使用 localStorage）
 * 这些数据是临时性的、页面级的
 */
export const WEB_STORAGE_KEYS = {
  // 缓存相关
  CACHE_IMAGE: "CACHE_IMAGE", // 图片缓存
  CACHE_RSS_LOGO: "CACHE_RSS_LOGO", // RSS Logo 缓存

  // 界面状态
  PANEL_ACTIVE: "PANEL_ACTIVE",

  // 表单相关
  FORM_DRAFT: "FORM_DRAFT", // 表单草稿

  // 用户配置
  LLM_API_KEYS: "LLM_API_KEYS", // 用户配置的 LLM API Keys

  // 应用数据
  NOTES: "APP_NOTES", // 笔记数据
  TODOS: "APP_TODOS", // 待办事项数据
};

/**
 * Session 存储键定义（使用 sessionStorage）
 * 这些数据只在当前会话有效
 */
export const SESSION_STORAGE_KEYS = {
  PLAYBACK_RATE: "USER_PLAYBACK_RATE", // 播放速率
};

// 向后兼容：导出所有存储键
export const STORAGE_KEYS = {
  ...EXTENSION_STORAGE_KEYS,
  ...WEB_STORAGE_KEYS,
  ...SESSION_STORAGE_KEYS,
};

/**
 * Chrome 扩展存储适配器
 * 优先使用 chrome.storage.local，降级到 localStorage
 * 使用统一的数据结构 { value, timestamp } 保证类型安全
 */
class ChromeStorageAdapter {
  constructor() {
    // 检测是否支持 chrome.storage
    this.isChromeStorageAvailable = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

    // 内存缓存，用于同步访问
    this.cache = new Map();

    // 初始化：从 chrome.storage 加载所有数据到缓存
    if (this.isChromeStorageAvailable) {
      this._initCache();
    }
  }

  /**
   * 初始化缓存（从 chrome.storage 加载所有数据）
   */
  async _initCache() {
    try {
      chrome.storage.local.get(null, (items) => {
        if (items) {
          Object.entries(items).forEach(([key, wrappedData]) => {
            // 解包数据，提取 value
            const value = this._unwrap(wrappedData);
            this.cache.set(key, value);
          });
        }
      });
    } catch (error) {
      console.error('[ChromeStorage] 初始化缓存失败:', error);
    }
  }

  /**
   * 包装数据：统一结构 { value, timestamp }
   * 自动解除 Proxy 包装，确保类型安全
   */
  _wrap(value) {
    return {
      value: this._toRaw(value),
      timestamp: Date.now()
    };
  }

  /**
   * 递归解除 Proxy 包装，转换为原始值
   */
  _toRaw(value) {
    // null 或 undefined
    if (value == null) return value;

    // 数组：递归处理每个元素
    if (Array.isArray(value)) {
      return value.map(item => this._toRaw(item));
    }

    // 对象：递归处理每个属性
    if (typeof value === 'object') {
      const raw = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          raw[key] = this._toRaw(value[key]);
        }
      }
      return raw;
    }

    // 基本类型：直接返回
    return value;
  }

  /**
   * 解包数据：提取 value
   */
  _unwrap(wrappedData) {
    // 如果是统一结构，提取 value
    if (wrappedData && typeof wrappedData === 'object' && 'value' in wrappedData && 'timestamp' in wrappedData) {
      return wrappedData.value;
    }
    // 兼容旧数据：直接返回原始数据
    return wrappedData;
  }

  /**
   * 获取值（同步）
   */
  get(key, defaultValue) {
    if (this.isChromeStorageAvailable) {
      // 从缓存读取（已解包的原始值）
      const value = this.cache.get(key);
      return value !== undefined && value !== null ? value : defaultValue;
    } else {
      // 降级到 localStorage
      const value = localStorage.get(key);
      return value !== undefined && value !== null ? value : defaultValue;
    }
  }

  /**
   * 设置值（同步更新缓存，异步写入 chrome.storage）
   */
  set(key, value) {
    if (this.isChromeStorageAvailable) {
      // 立即更新缓存（存储原始值）
      this.cache.set(key, value);

      // 包装后异步写入 chrome.storage
      const wrappedData = this._wrap(value);
      chrome.storage.local.set({ [key]: wrappedData }, () => {
        if (chrome.runtime.lastError) {
          console.error('[ChromeStorage] 写入失败:', chrome.runtime.lastError);
        }
      });
    } else {
      // 降级到 localStorage
      localStorage.set(key, value);
    }
  }

  /**
   * 删除值（同步更新缓存，异步删除 chrome.storage）
   */
  remove(key) {
    if (this.isChromeStorageAvailable) {
      // 立即从缓存删除
      this.cache.delete(key);

      // 异步从 chrome.storage 删除
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          console.error('[ChromeStorage] 删除失败:', chrome.runtime.lastError);
        }
      });
    } else {
      // 降级到 localStorage
      localStorage.remove(key);
    }
  }
}

// 创建扩展存储适配器实例
const chromeStorage = new ChromeStorageAdapter();

/**
 * 统一的存储管理器
 * 根据 key 类型自动选择合适的存储方式
 */
class StorageManager {
  /**
   * 判断 key 是否属于扩展存储
   */
  _isExtensionKey(key) {
    return Object.values(EXTENSION_STORAGE_KEYS).includes(key) ||
           key.startsWith(EXTENSION_STORAGE_KEYS.TAB_PREFIX);
  }

  /**
   * 判断 key 是否属于 session 存储
   */
  _isSessionKey(key) {
    return Object.values(SESSION_STORAGE_KEYS).includes(key);
  }

  /**
   * 获取存储值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值（可选）
   * @returns {*} 存储的值或默认值
   */
  get(key, defaultValue) {
    // 扩展存储键使用 chrome.storage.local
    if (this._isExtensionKey(key)) {
      return chromeStorage.get(key, defaultValue);
    }

    // 其他使用 localStorage
    const value = localStorage.get(key);
    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * 设置存储值
   * @param {string} key - 存储键
   * @param {*} value - 要存储的值
   */
  set(key, value) {
    // 扩展存储键使用 chrome.storage.local
    if (this._isExtensionKey(key)) {
      return chromeStorage.set(key, value);
    }

    // 其他使用 localStorage
    localStorage.set(key, value);
  }

  /**
   * 删除存储值
   * @param {string} key - 存储键
   */
  remove(key) {
    // 扩展存储键使用 chrome.storage.local
    if (this._isExtensionKey(key)) {
      return chromeStorage.remove(key);
    }

    // 其他使用 localStorage
    localStorage.remove(key);
  }

  /**
   * 获取 sessionStorage 值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值（可选）
   * @returns {*} 存储的值或默认值
   */
  getSession(key, defaultValue) {
    const value = sessionStorage.get(key);
    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * 设置 sessionStorage 值
   * @param {string} key - 存储键
   * @param {*} value - 要存储的值
   */
  setSession(key, value) {
    sessionStorage.set(key, value);
  }

  /**
   * 删除 sessionStorage 值
   * @param {string} key - 存储键
   */
  removeSession(key) {
    sessionStorage.remove(key);
  }

  /**
   * 获取 Tab 状态（自动处理前缀）
   * @param {string} panelKey - 面板键
   * @returns {*} Tab 状态
   */
  getTabState(panelKey) {
    return this.get(`${STORAGE_KEYS.TAB_PREFIX}${panelKey}`);
  }

  /**
   * 保存 Tab 状态（自动处理前缀）
   * @param {string} panelKey - 面板键
   * @param {*} value - Tab 状态值
   */
  setTabState(panelKey, value) {
    this.set(`${STORAGE_KEYS.TAB_PREFIX}${panelKey}`, value);
  }

  /**
   * 清除指定面板的 Tab 状态
   * @param {string} panelKey - 面板键
   */
  removeTabState(panelKey) {
    this.remove(`${STORAGE_KEYS.TAB_PREFIX}${panelKey}`);
  }
}

// 导出单例
export const storageManager = new StorageManager();
