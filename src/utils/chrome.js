import { isString } from "@linxs/toolkit";
export class ChromeAPI {
  static #instances = new Map();
  #key = "";

  constructor(key) {
    this.#key = `${key}`.trim();

    // 如果已存在实例，直接返回已存在的实例
    if (ChromeAPI.#instances.has(this.#key)) {
      return ChromeAPI.#instances.get(this.#key);
    }

    // 将实例存储在静态映射中
    ChromeAPI.#instances.set(this.#key, this);
  }

  // 静态方法获取实例
  static getInstance(key) {
    if (!isString(key)) {
      throw new Error("key must be a string");
    }
    return new this(key);
  }

  /**
   * 清除指定 key 的实例
   * @param {string} key
   */
  static clearInstance(key) {
    if (!isString(key)) {
      throw new Error("key must be a string");
    }
    this.#instances.delete(key);
  }

  /**
   * 设置 Chrome Storage
   * @param {any} data
   * @returns {Promise<void>}
   */
  async setStorage(data) {
    if (!chrome || !chrome.storage) return;

    await chrome.storage.local.set({
      [this.#key]: data,
    });
  }

  /**
   * 获取 Chrome Storage
   * @returns {Promise<any>}
   */
  async getStorage() {
    if (!chrome || !chrome.storage) return;

    return await chrome.storage.local.get(this.#key);
  }

  /**
   * 创建定时器 Alarm
   * @param {{key: string, alarmInfo: chrome.alarms.AlarmCreateInfo}}} options
   */
  async setAlarm(options) {
    const { key, alarmInfo } = options;
    if (!isString(key)) {
      throw new Error("key must be a string");
    }

    if (!chrome || !chrome.alarms) return;

    try {
      await chrome.alarms.create(key || this.#key, alarmInfo);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 获取定时器信息 Alarm
   * @param {string} key
   * @returns {Promise<chrome.alarms.Alarm | undefined>}
   */
  async getAlarm(key) {
    if (!isString(key)) {
      throw new Error("key must be a string");
    }
    if (!chrome || !chrome.alarms) return;

    return await chrome.alarms.get(key || this.#key);
  }
}

export const getChromeTopSites = async () => {
  if (!chrome) return [];
  if (!chrome.topSites || !chrome.runtime) return [];

  const ChromeAPI = ChromeAPI.getInstance("topSites");

  const historyList = await chrome.topSites.get();

  const getFaviconUrl = async (u) => {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u); // this encodes the URL as well
    url.searchParams.set("size", "16");
    return url.toString();
  };

  return historyList.map((value) => ({
    ...value,
    favicon: getFaviconUrl(value.url),
    domainUrl: value.url.replace(/https?:\/\//, "").split("/")[0],
  }));
};
