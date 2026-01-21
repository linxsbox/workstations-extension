import { getOSType, OSType } from "@linxs/toolkit";

/**
 * 获取当前操作系统类型
 */
export const getCurrentOS = () => {
  return getOSType();
};

/**
 * 判断是否为 macOS
 */
export const isMacOS = () => {
  return getCurrentOS() === OSType.macOS;
};

/**
 * 判断是否为 Windows
 */
export const isWindows = () => {
  return getCurrentOS() === OSType.Windows;
};

/**
 * 判断是否为 Linux
 */
export const isLinux = () => {
  return getCurrentOS() === OSType.Linux;
};

/**
 * 快捷键动作类型
 */
export const ShortcutAction = {
  // 核心功能
  TOGGLE_PLAYER: "toggle_player",
  OPEN_NOTES: "open_notes",
  OPEN_TASKS: "open_tasks",
  OPEN_SEARCH: "open_search",

  // 面板切换
  SWITCH_TO_RSS: "switch_to_rss",
  SWITCH_TO_TOOLS: "switch_to_tools",
  SWITCH_TO_FAVORITES: "switch_to_favorites",
  SWITCH_TO_SHARE: "switch_to_share",

  // 通用操作
  CLOSE_MODAL: "close_modal",
  OPEN_SETTINGS: "open_settings",
  TOGGLE_THEME: "toggle_theme",
  SHOW_SHORTCUTS_HELP: "show_shortcuts_help",
};
