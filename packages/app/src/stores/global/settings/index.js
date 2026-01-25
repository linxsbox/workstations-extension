import { defineStore } from "pinia";
import { storageManager, STORAGE_KEYS } from "../../storage";
import { SettingSectionEnum } from "./config";

// 从存储中获取用户偏好设置
const storedTheme = storageManager.get(STORAGE_KEYS.THEME_MODE);
const storedFontSize = storageManager.get(STORAGE_KEYS.FONT_SIZE);

export const storeSettings = defineStore({
  id: "StoreSettings",
  state: () => ({
    showSettingDialog: false,
    activeSettingSection: SettingSectionEnum.GENERAL,

    // 主题设置：system(跟随系统), dark(深色), light(明亮)
    themeMode: storedTheme || "system",

    // 字体大小：默认 16px
    fontSize: storedFontSize || 16,

    // 语言（待实现）
    language: 'zh-CN',

    // 通知类型（待实现）
    notificationType: 'all',

    // 提示音（待实现）
    soundEnabled: true,
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
      storageManager.set(STORAGE_KEYS.THEME_MODE, mode);

      if (mode === "system") {
        // 自动模式：根据当前系统主题设置
        updateThemeMode(getPrefersTheme());
      } else {
        // 手动模式：设置具体的主题
        updateThemeMode(mode === "dark");
      }
    },

    // 设置字体大小
    setFontSize(size) {
      this.fontSize = size;
      storageManager.set(STORAGE_KEYS.FONT_SIZE, size);
      updateFontSize(size);
    },

    // 初始化设置
    initializeSettings() {
      this.setThemeMode(this.themeMode);
      this.setFontSize(this.fontSize);

      // 监听系统主题变化
      if (window.matchMedia) {
        const darkModeMediaQuery = getMediaPrefersScheme();

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

    // 设置语言（待实现）
    setLanguage(language) {
      this.language = language;
      // TODO: 实现语言切换逻辑
    },

    // 设置通知类型（待实现）
    setNotificationType(type) {
      this.notificationType = type;
      // TODO: 实现通知类型切换逻辑
    },

    // 设置提示音开关（待实现）
    setSoundEnabled(enabled) {
      this.soundEnabled = enabled;
      // TODO: 实现提示音开关逻辑
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
  return getMediaPrefersScheme().matches;  // 返回 boolean：true=深色, false=浅色
};
