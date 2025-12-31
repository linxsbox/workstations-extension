import { defineStore } from "pinia";
import { defaultStorage } from "@linxs/toolkit";
import { SettingSectionEnum } from "./config";

const { localStorage } = defaultStorage();

const STORAGE_KEY = "USER_RSS_ACTIVE";
const STORAGE_KEYS = {
  THEME: "USER_THEME_MODE",
  FONT_SIZE: "USER_FONT_SIZE",
};

// 从 localStorage 获取存储的值
const storedTheme = localStorage.get(STORAGE_KEYS.THEME);
const storedFontSize = localStorage.get(STORAGE_KEYS.FONT_SIZE);

export const storeSettings = defineStore({
  id: "StoreSettings",
  state: () => ({
    showSettingDialog: false,
    activeSettingSection: SettingSectionEnum.GENERAL,
    // 主题设置：system(跟随系统), dark(深色), light(明亮)
    themeMode: storedTheme || "system",
    // 字体大小：默认 14px
    fontSize: storedFontSize || 16,
  }),

  getters: {
    isDarkMode() {
      if (this.themeMode === "system") {
        return getPrefersTheme();
      }
      return this.themeMode === "dark";
    },
  },

  actions: {
    init() {},
    setRssTypeActive(key) {
      if (!key) return;
      localStorage.set(STORAGE_KEY, key);
    },

    // 打开设置面板
    openSetting(section = SettingSectionEnum.GENERAL) {
      this.showSettingDialog = true;
      this.activeSettingSection = section;
    },

    // 关闭设置面板
    closeSetting() {
      this.showSettingDialog = false;
    },

    // 切换设置部分
    switchSettingSection(section) {
      if (Object.values(SettingSectionEnum).includes(section)) {
        this.activeSettingSection = section;
      }
    },

    // 设置主题
    setThemeMode(mode) {
      this.themeMode = mode;
      localStorage.set(STORAGE_KEYS.THEME, mode);
      updateThemeMode(this.isDarkMode);
    },

    // 设置字体大小
    setFontSize(size) {
      this.fontSize = size;
      localStorage.set(STORAGE_KEYS.FONT_SIZE, size);
      updateFontSize(size);
    },

    // 初始化设置
    initializeSettings() {
      this.setThemeMode(this.themeMode);
      this.setFontSize(this.fontSize);

      // 监听系统主题变化
      if (window.matchMedia) {
        const darkModeMediaQuery = getMediaPrefersScheme();

        // 移除可能存在的旧监听器
        const mediaQueryHandler = (e) => {
          // 只有在用户选择"跟随系统"时才响应系统主题变化
          if (this.themeMode === "system") {
            updateThemeMode(e.matches);
          }
        };

        // 添加新的监听器
        darkModeMediaQuery.addEventListener("change", mediaQueryHandler);
      }
    },
  },
});

/**
 * 更新文档根元素的主题属性
 * @param {boolean} isDark 是否为深色主题
 */
const updateThemeMode = (isDark) => {
  document.documentElement.setAttribute(
    "theme-mode",
    isDark ? "dark" : "light"
  );
};

/**
 * 更新文档根元素的字体大小
 * @param {number} size 字体大小（px）
 */
const updateFontSize = (size) => {
  document.documentElement.style.setProperty("--font-size", `${size}px`);
};

const getMediaPrefersScheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)");
};

const getPrefersTheme = () => {
  return getMediaPrefersScheme().matches ? "dark" : "light";
};
