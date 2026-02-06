import { defaultStorage } from "@linxs/toolkit";

const { localStorage, sessionStorage } = defaultStorage();

/**
 * 系统配置存储键
 */
export const SYSTEM_STORAGE_KEYS = {
  THEME_MODE: "USER_THEME_MODE",
  FONT_SIZE: "USER_FONT_SIZE",
};

/**
 * 播放器存储键
 */
export const PLAYER_STORAGE_KEYS = {
  PLAYER_PLAY_QUEUE: "PLAYER_PLAY_QUEUE",
  PLAYER_VIEW_MODE: "PLAYER_VIEW_MODE",
  PLAYER_PLAY_MODE: "PLAYER_PLAY_MODE",
  PLAYER_POSITION: "PLAYER_POSITION",
  PLAYER_VOLUME: "PLAYER_VOLUME",
};

/**
 * RSS 存储键
 */
export const RSS_STORAGE_KEYS = {
  RSS_SOURCES: "RSS_SOURCES",
  RSS_PANEL_TAB_STATE: "RSS_PANEL_TAB_STATE", // RSS 面板的 Tab 状态（单个键存储所有面板的 Tab 状态）
};

/**
 * 笔记存储键
 */
export const NOTES_STORAGE_KEYS = {
  NOTES: "APP_NOTES",
};

/**
 * 任务存储键
 */
export const TASKS_STORAGE_KEYS = {
  TODOS: "APP_TODOS",
};

/**
 * WebRTC 存储键
 */
export const WEBRTC_STORAGE_KEYS = {
  PEER_ID: "webrtc_peer_id",
};

/**
 * 扩展存储键定义（使用 chrome.storage.local，降级到 localStorage）
 * 这些数据需要跨页面共享、长期保存
 */
export const EXTENSION_STORAGE_KEYS = {
  ...SYSTEM_STORAGE_KEYS,
  ...PLAYER_STORAGE_KEYS,
  ...RSS_STORAGE_KEYS,
  ...WEBRTC_STORAGE_KEYS,
};

/**
 * 网页存储键定义（使用 localStorage）
 * 这些数据是临时性的、页面级的
 */
export const WEB_STORAGE_KEYS = {
  ...NOTES_STORAGE_KEYS,
  ...TASKS_STORAGE_KEYS,

  // 缓存相关
  CACHE_IMAGE: "CACHE_IMAGE", // 图片缓存
  CACHE_RSS_LOGO: "CACHE_RSS_LOGO", // RSS Logo 缓存

  // 界面状态
  PANEL_ACTIVE: "PANEL_ACTIVE",

  // 表单相关
  FORM_DRAFT: "FORM_DRAFT", // 表单草稿

  // 用户配置
  LLM_API_KEYS: "LLM_API_KEYS", // 用户配置的 LLM API Keys
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

    // 初始化状态标记
    this.isInitialized = false;
    this.initPromise = null;

    // 初始化：从 chrome.storage 加载所有数据到缓存
    if (this.isChromeStorageAvailable) {
      this.initPromise = this._initCache();
    } else {
      this.isInitialized = true;
    }
  }

  /**
   * 初始化缓存（从 chrome.storage 加载所有数据）
   */
  async _initCache() {
    try {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (items) => {
          if (chrome.runtime.lastError) {
            console.error('[ChromeStorage] 初始化缓存失败:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }

          if (items) {
            Object.entries(items).forEach(([key, wrappedData]) => {
              // 解包数据，提取 value
              const value = this._unwrap(wrappedData);
              this.cache.set(key, value);
            });
          }

          this.isInitialized = true;
          console.log('[ChromeStorage] 缓存初始化完成，已加载', this.cache.size, '个键');
          resolve();
        });
      });
    } catch (error) {
      console.error('[ChromeStorage] 初始化缓存失败:', error);
      this.isInitialized = true; // 即使失败也标记为已初始化，避免阻塞
      throw error;
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
   * 注意：必须在 waitForInit() 完成后调用，否则可能读取到空缓存
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
   * 等待初始化完成
   * 在读取数据前调用此方法确保缓存已加载
   */
  async waitForInit() {
    if (this.initPromise && !this.isInitialized) {
      await this.initPromise;
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
   * 等待存储初始化完成
   * 在应用启动时调用，确保数据已从 chrome.storage 加载到缓存
   */
  async waitForInit() {
    await chromeStorage.waitForInit();
  }

  /**
   * 判断 key 是否属于扩展存储
   */
  _isExtensionKey(key) {
    if (!key || typeof key !== 'string') return false;
    return Object.values(EXTENSION_STORAGE_KEYS).includes(key);
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
   * 获取 RSS 面板的 Tab 状态
   * @returns {*} RSS Tab 状态
   */
  getRssTabState() {
    return this.get(RSS_STORAGE_KEYS.RSS_PANEL_TAB_STATE);
  }

  /**
   * 保存 RSS 面板的 Tab 状态
   * @param {*} value - Tab 状态值
   */
  setRssTabState(value) {
    this.set(RSS_STORAGE_KEYS.RSS_PANEL_TAB_STATE, value);
  }

  /**
   * 清除 RSS 面板的 Tab 状态
   */
  removeRssTabState() {
    this.remove(RSS_STORAGE_KEYS.RSS_PANEL_TAB_STATE);
  }
}

// 导出单例
export const storageManager = new StorageManager();
