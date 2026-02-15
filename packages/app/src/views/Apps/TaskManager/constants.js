/**
 * 任务管理器常量定义
 */

import { COOLDOWN } from '@/constants/timing';

// 任务状态
export const TASK_STATUS = {
  PENDING: "pending", // 待启动
  RUNNING: "running", // 运行中
  COMPLETED: "completed", // 已完成
};

// 执行规则
export const EXECUTION_RULE = {
  EXPECTED: "expected", // 预期时间（倒计时）
  SCHEDULED: "scheduled", // 计划时间（定时）
};

// 时间限制（毫秒）
export const TIME_LIMITS = {
  MIN_EXPECTED_MINUTES: 1, // 预期时间最小值（分钟）
  MIN_SCHEDULED_DELAY: COOLDOWN.FIVE_MINUTES, // 计划时间最小延迟（5分钟）
  MAX_EXPECTED_HOURS: 8, // 预期时间最大小时数
  MAX_EXPECTED_MINUTES: 60, // 预期时间最大分钟数
};

// 字数限制
export const TEXT_LIMITS = {
  MAX_TITLE_LENGTH: 30, // 标题最大字数
  MAX_CONTENT_LENGTH: 200, // 内容最大字数
};

// 通知配置
export const NOTIFICATION_CONFIG = {
  DURATION: 5000, // Naive UI 通知显示时长（毫秒）
  ICON: "/favicon.ico", // 浏览器通知图标
};
