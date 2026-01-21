import { ref, onMounted, onUnmounted } from "vue";
import { isMacOS, ShortcutAction } from "./config";
import { env } from "@/utils/env";

const isMac = isMacOS();

/**
 * 快捷键配置映射
 * macOS: Shift + Option + Key
 * Windows/Linux: Alt + Key
 *
 * 使用 keyCode 而不是 key，因为 keyCode 不受修饰键影响且兼容性最好
 * 参考: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
 */
const shortcutMap = {
  // 面板切换
  [ShortcutAction.SWITCH_TO_RSS]: { keyCode: 49, alt: true, shift: isMac }, // 1
  [ShortcutAction.SWITCH_TO_TOOLS]: { keyCode: 50, alt: true, shift: isMac }, // 2
  [ShortcutAction.SWITCH_TO_FAVORITES]: { keyCode: 51, alt: true, shift: isMac }, // 3
  [ShortcutAction.SWITCH_TO_SHARE]: { keyCode: 52, alt: true, shift: isMac }, // 4

  // 核心功能
  [ShortcutAction.TOGGLE_PLAYER]: { keyCode: 80, alt: true, shift: isMac }, // P
  [ShortcutAction.OPEN_NOTES]: { keyCode: 78, alt: true, shift: isMac }, // N
  [ShortcutAction.OPEN_TASKS]: { keyCode: 84, alt: true, shift: isMac }, // T
  [ShortcutAction.OPEN_SEARCH]: { keyCode: 83, alt: true, shift: isMac }, // S

  // 通用操作
  // [ShortcutAction.CLOSE_MODAL]: { keyCode: 27, alt: false, shift: false }, // Escape
  [ShortcutAction.TOGGLE_THEME]: { keyCode: 77, alt: true, shift: isMac }, // M
  [ShortcutAction.OPEN_SETTINGS]: { keyCode: 188, alt: true, shift: true }, // ,
  // [ShortcutAction.SHOW_SHORTCUTS_HELP]: { keyCode: 191, ctrl: true, shift: false }, // /
};

/**
 * 检查是否在输入元素中
 */
const isInInputElement = (target) => {
  if (!target) return false;

  const tagName = target.tagName?.toUpperCase();
  const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
  const isContentEditable = target.isContentEditable;

  return isInput || isContentEditable;
};

/**
 * 匹配快捷键
 * 使用 event.keyCode 进行匹配，因为 keyCode 不受修饰键影响且兼容性最好
 * 严格按照配置的修饰键进行匹配
 */
const matchShortcut = (event, shortcutConfig) => {
  // 使用 keyCode 匹配，不受 Shift 等修饰键影响
  if (event.keyCode !== shortcutConfig.keyCode) return false;

  // 修饰键匹配（严格匹配配置）
  const altMatch = event.altKey === (shortcutConfig.alt || false);
  const shiftMatch = event.shiftKey === (shortcutConfig.shift || false);
  const ctrlMatch = event.ctrlKey === (shortcutConfig.ctrl || false);
  const metaMatch = event.metaKey === (shortcutConfig.meta || false);

  return altMatch && shiftMatch && ctrlMatch && metaMatch;
};

/**
 * 键盘快捷键 Composable
 * @param {Object} handlers - 快捷键处理函数映射
 * @returns {Object} - 快捷键相关方法
 */
export function useKeyboardShortcuts(handlers = {}) {
  const isEnabled = ref(true);

  /**
   * 处理键盘事件
   */
  const handleKeydown = (event) => {
    // 如果快捷键被禁用，直接返回
    if (!isEnabled.value) return;

    // 如果在输入元素中，忽略快捷键（除了 Escape）
    if (isInInputElement(event.target) && event.key !== "Escape") {
      return;
    }

    // 遍历快捷键配置，查找匹配项
    for (const [action, config] of Object.entries(shortcutMap)) {
      if (matchShortcut(event, config)) {
        event.preventDefault();
        event.stopPropagation();

        // 调用对应的处理函数
        const handler = handlers[action];
        if (handler && typeof handler === "function") {
          handler(event);
        }

        break;
      }
    }
  };

  /**
   * 注册快捷键监听
   */
  const registerShortcuts = () => {
    // 扩展环境：监听 chrome.commands API（如果有）
    if (env.hasCommands()) {
      chrome.commands.onCommand.addListener((command) => {
        const handler = handlers[command];
        if (handler && typeof handler === "function") {
          handler();
        }
      });
    }

    // 同时注册 window 全局事件（扩展和浏览器环境都需要）
    window.addEventListener("keydown", handleKeydown, true);
  };

  /**
   * 注销快捷键监听
   */
  const unregisterShortcuts = () => {
    window.removeEventListener("keydown", handleKeydown, true);
  };

  /**
   * 启用快捷键
   */
  const enable = () => {
    isEnabled.value = true;
  };

  /**
   * 禁用快捷键
   */
  const disable = () => {
    isEnabled.value = false;
  };

  /**
   * 将 keyCode 转换为可读的按键名称
   */
  const keyCodeToKeyName = (keyCode) => {
    // 数字键 0-9: 48-57
    if (keyCode >= 48 && keyCode <= 57) {
      return String.fromCharCode(keyCode);
    }
    // 字母键 A-Z: 65-90
    if (keyCode >= 65 && keyCode <= 90) {
      return String.fromCharCode(keyCode);
    }
    // 特殊键映射
    const specialKeys = {
      188: ",",
      190: ".",
      191: "/",
      220: "\\",
      186: ";",
      222: "'",
      219: "[",
      221: "]",
      189: "-",
      187: "=",
      192: "`",
      27: "Esc",
      32: "Space",
      13: "Enter",
      9: "Tab",
    };
    return specialKeys[keyCode] || `Key${keyCode}`;
  };

  /**
   * 获取快捷键显示文本
   * @param {string} action - 快捷键动作
   * @returns {string} - 快捷键显示文本
   */
  const getShortcutText = (action) => {
    const config = shortcutMap[action];
    if (!config) return "";

    const isMac = isMacOS();
    const parts = [];

    if (isMac) {
      // macOS: Shift + Option + Key
      if (config.shift) parts.push("⇧");
      if (config.alt) parts.push("⌥");
      if (config.ctrl) parts.push("⌃");
      if (config.meta) parts.push("⌘");
    } else {
      // Windows/Linux
      if (config.ctrl) parts.push("Ctrl");
      if (config.alt) parts.push("Alt");
      if (config.shift) parts.push("Shift");
    }

    // 添加按键（从 keyCode 转换）
    const keyName = keyCodeToKeyName(config.keyCode);
    parts.push(keyName);

    return parts.join(isMac ? "" : "+");
  };

  // 生命周期钩子
  onMounted(() => {
    registerShortcuts();
  });

  onUnmounted(() => {
    unregisterShortcuts();
  });

  return {
    isEnabled,
    enable,
    disable,
    getShortcutText,
  };
}

