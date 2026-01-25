import { defineStore } from "pinia";
import { ShortcutAction } from "@/composables/shortcuts/config";

/**
 * 快捷键 Store
 * 管理快捷键的启用/禁用状态和配置
 */
export const storeShortcuts = defineStore("shortcuts", {
  state: () => ({
    // 全局快捷键启用状态
    isEnabled: true,

    // 各个快捷键的启用状态
    shortcuts: {
      [ShortcutAction.TOGGLE_PLAYER]: { enabled: true, description: "打开/关闭播放器" },
      [ShortcutAction.OPEN_NOTES]: { enabled: true, description: "打开笔记" },
      [ShortcutAction.OPEN_TASKS]: { enabled: true, description: "打开任务管理" },
      [ShortcutAction.OPEN_SEARCH]: { enabled: true, description: "聚焦搜索框" },
      [ShortcutAction.SWITCH_TO_RSS]: { enabled: true, description: "切换到 RSS 面板" },
      [ShortcutAction.SWITCH_TO_TOOLS]: { enabled: true, description: "切换到工具面板" },
      [ShortcutAction.SWITCH_TO_FAVORITES]: { enabled: true, description: "切换到收藏面板" },
      [ShortcutAction.SWITCH_TO_SHARE]: { enabled: true, description: "切换到分享面板" },
      [ShortcutAction.CLOSE_MODAL]: { enabled: true, description: "关闭弹窗" },
      [ShortcutAction.OPEN_SETTINGS]: { enabled: true, description: "打开设置" },
      [ShortcutAction.SHOW_SHORTCUTS_HELP]: { enabled: true, description: "显示快捷键帮助" },
    },
  }),

  getters: {
    /**
     * 获取所有启用的快捷键
     */
    enabledShortcuts: (state) => {
      if (!state.isEnabled) return [];

      return Object.entries(state.shortcuts)
        .filter(([_, config]) => config.enabled)
        .map(([action]) => action);
    },

    /**
     * 检查指定快捷键是否启用
     */
    isShortcutEnabled: (state) => (action) => {
      if (!state.isEnabled) return false;
      return state.shortcuts[action]?.enabled || false;
    },
  },

  actions: {
    /**
     * 启用全局快捷键
     */
    enableGlobal() {
      this.isEnabled = true;
    },

    /**
     * 禁用全局快捷键
     */
    disableGlobal() {
      this.isEnabled = false;
    },

    /**
     * 切换全局快捷键状态
     */
    toggleGlobal() {
      this.isEnabled = !this.isEnabled;
    },

    /**
     * 启用指定快捷键
     */
    enableShortcut(action) {
      if (this.shortcuts[action]) {
        this.shortcuts[action].enabled = true;
      }
    },

    /**
     * 禁用指定快捷键
     */
    disableShortcut(action) {
      if (this.shortcuts[action]) {
        this.shortcuts[action].enabled = false;
      }
    },

    /**
     * 切换指定快捷键状态
     */
    toggleShortcut(action) {
      if (this.shortcuts[action]) {
        this.shortcuts[action].enabled = !this.shortcuts[action].enabled;
      }
    },
  },
});
