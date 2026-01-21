/**
 * 环境检测工具
 * 统一管理应用运行环境的检测逻辑
 */

class Environment {
  constructor() {
    this._isExtension = null;
    this._hasAlarms = null;
    this._hasCommands = null;
  }

  /**
   * 检测是否在 Chrome Extension 环境中
   * @returns {boolean}
   */
  isExtension() {
    if (this._isExtension !== null) {
      return this._isExtension;
    }

    try {
      this._isExtension = typeof chrome !== "undefined" &&
                          chrome.runtime !== undefined &&
                          chrome.runtime.id !== undefined;
    } catch (e) {
      this._isExtension = false;
    }

    return this._isExtension;
  }

  /**
   * 检测是否支持 Chrome Alarms API
   * @returns {boolean}
   */
  hasAlarms() {
    if (this._hasAlarms !== null) {
      return this._hasAlarms;
    }

    try {
      this._hasAlarms = typeof chrome !== "undefined" &&
                        chrome.alarms !== undefined &&
                        typeof chrome.alarms.create === "function";
    } catch (e) {
      this._hasAlarms = false;
    }

    return this._hasAlarms;
  }

  /**
   * 检测是否支持 Chrome Commands API
   * @returns {boolean}
   */
  hasCommands() {
    if (this._hasCommands !== null) {
      return this._hasCommands;
    }

    try {
      this._hasCommands = typeof chrome !== "undefined" &&
                          chrome.commands !== undefined &&
                          chrome.commands.onCommand !== undefined;
    } catch (e) {
      this._hasCommands = false;
    }

    return this._hasCommands;
  }

  /**
   * 获取环境类型描述
   * @returns {string}
   */
  getType() {
    return this.isExtension() ? "extension" : "web";
  }
}

// 导出单例
export const env = new Environment();
