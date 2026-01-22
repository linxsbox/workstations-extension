import { getOSType, OSType } from "@linxs/toolkit";
import { getPanelKeys } from "@/stores/config/panelConfig";

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

  // 通用操作
  CLOSE_MODAL: "close_modal",
  OPEN_SETTINGS: "open_settings",
  TOGGLE_THEME: "toggle_theme",
  SHOW_SHORTCUTS_HELP: "show_shortcuts_help",
};

/**
 * 动态生成面板切换动作
 * 根据 panelConfig 的顺序生成 SWITCH_TO_PANEL_0, SWITCH_TO_PANEL_1 等
 */
export const generatePanelActions = () => {
  const panelKeys = getPanelKeys();
  const actions = {};

  panelKeys.forEach((key, index) => {
    actions[`SWITCH_TO_PANEL_${index}`] = `switch_to_panel_${index}`;
  });

  return actions;
};

/**
 * 获取面板对应的快捷键动作
 */
export const getPanelAction = (index) => {
  return `switch_to_panel_${index}`;
};
