import { defaultStorage } from "@linxs/toolkit";

const { localStorage, sessionStorage } = defaultStorage();

/**
 * 统一的存储键定义
 */
export const STORAGE_KEYS = {
  // 图片缓存
  CACHE_IMAGE: "CACHE_IMAGE",

  // 设置相关
  THEME_MODE: "USER_THEME_MODE",
  FONT_SIZE: "USER_FONT_SIZE",

  // 界面状态
  PANEL_ACTIVE: "PANEL_ACTIVE",
  TAB_PREFIX: "USER_TAB_",

  // 播放器相关
  VOLUME: "USER_VOLUME",
  PLAYBACK_RATE: "USER_PLAYBACK_RATE", // 使用 sessionStorage
  PLAY_HISTORY: "PLAY_HISTORY",
  PLAYLISTS: "USER_PLAYLISTS",
  VIEW_MODE: "PLAYER_VIEW_MODE", // 播放器视图模式

  // 业务数据
  RSS_SOURCES: "USER_RSS_SOURCES",
};

/**
 * 统一的存储管理器
 * 对 @linxs/toolkit 的 localStorage 进行封装和扩展
 */
class StorageManager {
  /**
   * 获取存储值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值（可选）
   * @returns {*} 存储的值或默认值
   */
  get(key, defaultValue) {
    const value = localStorage.get(key);
    return value !== undefined && value !== null ? value : defaultValue;
  }

  /**
   * 设置存储值
   * @param {string} key - 存储键
   * @param {*} value - 要存储的值
   */
  set(key, value) {
    localStorage.set(key, value);
  }

  /**
   * 删除存储值
   * @param {string} key - 存储键
   */
  remove(key) {
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
