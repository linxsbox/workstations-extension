/**
 * 全局时间间隔常量
 * 用于统一管理应用中的所有时间阈值和延迟配置
 */

/**
 * UI 交互延迟
 */
export const UI_DELAYS = {
  // 快速防抖延迟（用于输入框、按钮等快速交互）
  DEBOUNCE_SHORT: 300,

  // 中等防抖延迟（用于搜索、自动保存等）
  DEBOUNCE_MEDIUM: 500,

  // 动画延迟（用于 UI 状态重置、过渡动画等）
  ANIMATION: 200,
};

/**
 * 业务冷却时间
 */
export const COOLDOWN = {
  // 5分钟冷却（RSS 更新、任务调度最小间隔）
  FIVE_MINUTES: 5 * 60 * 1000,
};

/**
 * 网络超时配置
 */
export const NETWORK = {
  // 网络请求超时时间（HTTP、WebRTC）
  REQUEST_TIMEOUT: 30000,
};

/**
 * 播放器配置
 */
export const PLAYER = {
  // 最小播放时长（用于播放统计，低于此时长不计入播放记录）
  MIN_PLAY_DURATION: 10000,
};
