/**
 * Storage Service
 * 统一的存储服务层
 *
 * 封装 localStorage 和 Chrome Storage API
 */

import { defaultStorage } from "@linxs/toolkit";

const { localStorage } = defaultStorage();

/**
 * LocalStorage 封装
 */
export class LocalStorageService {
  static get(key) {
    return localStorage.get(key);
  }

  static set(key, value) {
    return localStorage.set(key, value);
  }

  static remove(key) {
    return localStorage.remove(key);
  }

  static clear() {
    return localStorage.clear();
  }
}

/**
 * Chrome Storage 封装
 * 用于扩展程序的跨标签页数据同步
 */
export class ChromeStorageService {
  static async get(key) {
    if (!chrome?.storage) return null;

    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  static async set(key, value) {
    if (!chrome?.storage) return;

    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }

  static async remove(key) {
    if (!chrome?.storage) return;

    return new Promise((resolve) => {
      chrome.storage.sync.remove(key, resolve);
    });
  }
}

export default {
  local: LocalStorageService,
  chrome: ChromeStorageService,
};
