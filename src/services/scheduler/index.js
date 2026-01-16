/**
 * 任务调度服务
 *
 * 提供基于时间的任务调度能力，支持：
 * - Chrome Extension Alarms API（优先）
 * - Service Worker 定时检查（降级）
 *
 * @example
 * ```javascript
 * import TaskScheduler from "@/services/scheduler";
 *
 * // 创建定时任务
 * await TaskScheduler.schedule({
 *   id: "task-123",
 *   triggerAt: Date.now() + 60000, // 1分钟后
 *   data: { title: "任务标题" }
 * });
 *
 * // 监听任务触发
 * TaskScheduler.on("task-123", (data) => {
 *   console.log("任务触发", data);
 * });
 *
 * // 取消任务
 * await TaskScheduler.cancel("task-123");
 * ```
 */

import { storageManager } from "@/stores/storage";

const STORAGE_KEY = "SCHEDULER_TASKS";
const ALARM_PREFIX = "scheduler_";
const CHECK_INTERVAL = 60000; // 降级方案检查间隔：60秒

class TaskScheduler {
  constructor() {
    this.listeners = new Map();
    this.initialized = false;
    this.isExtension = this.detectExtension();
    this.checkIntervalId = null;

    console.log(`[TaskScheduler] Environment: ${this.isExtension ? "Chrome Extension" : "Web"}`);
  }

  /**
   * 检测是否在 Chrome Extension 环境中
   */
  detectExtension() {
    try {
      return (
        typeof chrome !== "undefined" &&
        chrome.alarms !== undefined &&
        typeof chrome.alarms.create === "function"
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * 初始化调度器
   */
  async init() {
    if (this.initialized) return;

    if (this.isExtension) {
      await this.initExtensionScheduler();
    } else {
      await this.initWebScheduler();
    }

    this.initialized = true;
  }

  /**
   * 初始化 Chrome Extension 调度器
   */
  async initExtensionScheduler() {
    try {
      // 监听 alarm 事件
      if (chrome.alarms && chrome.alarms.onAlarm) {
        chrome.alarms.onAlarm.addListener((alarm) => {
          if (alarm.name.startsWith(ALARM_PREFIX)) {
            const taskId = alarm.name.replace(ALARM_PREFIX, "");
            this.handleTaskTrigger(taskId);
          }
        });
      }

      // 恢复已存在的任务
      await this.restoreTasks();
      console.log("[TaskScheduler] Extension scheduler initialized");
    } catch (error) {
      console.error("[TaskScheduler] Extension init error:", error);
      // 降级到 Web 方案
      this.isExtension = false;
      await this.initWebScheduler();
    }
  }

  /**
   * 初始化 Web 调度器（降级方案）
   */
  async initWebScheduler() {
    console.log("[TaskScheduler] Using web scheduler (fallback)");

    // 使用定时检查机制
    this.checkIntervalId = setInterval(() => {
      this.checkPendingTasks();
    }, CHECK_INTERVAL);

    // 页面可见性变化时也检查一次
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          this.checkPendingTasks();
        }
      });
    }

    // 立即检查一次
    await this.checkPendingTasks();
  }

  /**
   * 恢复已存储的任务
   */
  async restoreTasks() {
    const tasks = this.getTasks();
    const now = Date.now();

    for (const task of tasks) {
      if (task.triggerAt > now) {
        // 任务还未到期，重新创建 alarm
        if (this.isExtension) {
          await this.createExtensionAlarm(task.id, task.triggerAt);
        }
      } else {
        // 任务已过期，立即触发
        await this.handleTaskTrigger(task.id);
      }
    }
  }

  /**
   * 检查待触发的任务（降级方案）
   */
  async checkPendingTasks() {
    const tasks = this.getTasks();
    const now = Date.now();

    for (const task of tasks) {
      if (task.triggerAt <= now) {
        await this.handleTaskTrigger(task.id);
      }
    }
  }

  /**
   * 创建 Chrome Extension Alarm
   */
  async createExtensionAlarm(taskId, triggerAt) {
    const alarmName = ALARM_PREFIX + taskId;
    const delayInMinutes = Math.max((triggerAt - Date.now()) / 60000, 0.1);

    return new Promise((resolve, reject) => {
      chrome.alarms.create(alarmName, { delayInMinutes }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 清除 Chrome Extension Alarm
   */
  async clearExtensionAlarm(taskId) {
    const alarmName = ALARM_PREFIX + taskId;

    return new Promise((resolve) => {
      chrome.alarms.clear(alarmName, (wasCleared) => {
        resolve(wasCleared);
      });
    });
  }

  /**
   * 调度任务
   * @param {Object} options - 任务选项
   * @param {string} options.id - 任务唯一标识
   * @param {number} options.triggerAt - 触发时间戳（毫秒）
   * @param {any} options.data - 任务数据
   */
  async schedule({ id, triggerAt, data }) {
    try {
      if (!this.initialized) {
        await this.init();
      }

      // 存储任务
      const tasks = this.getTasks();
      const existingIndex = tasks.findIndex((t) => t.id === id);

      const task = {
        id,
        triggerAt,
        data,
        createdAt: Date.now(),
      };

      if (existingIndex > -1) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }

      this.saveTasks(tasks);

      // 创建调度
      if (this.isExtension) {
        await this.createExtensionAlarm(id, triggerAt);
      }

      console.log(`[TaskScheduler] Task scheduled: ${id}, trigger at ${new Date(triggerAt).toLocaleString()}`);
    } catch (error) {
      console.error(`[TaskScheduler] Schedule error for task ${id}:`, error);
      throw error;
    }
  }

  /**
   * 取消任务
   * @param {string} taskId - 任务ID
   */
  async cancel(taskId) {
    if (!this.initialized) {
      await this.init();
    }

    // 从存储中移除
    const tasks = this.getTasks();
    const filteredTasks = tasks.filter((t) => t.id !== taskId);
    this.saveTasks(filteredTasks);

    // 清除调度
    if (this.isExtension) {
      await this.clearExtensionAlarm(taskId);
    }

    // 移除监听器
    this.listeners.delete(taskId);
  }

  /**
   * 处理任务触发
   */
  async handleTaskTrigger(taskId) {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;

    // 触发回调
    const callback = this.listeners.get(taskId);
    if (callback) {
      try {
        await callback(task.data);
      } catch (error) {
        console.error(`Task ${taskId} callback error:`, error);
      }
    }

    // 从存储中移除已完成的任务
    await this.cancel(taskId);
  }

  /**
   * 监听任务触发
   * @param {string} taskId - 任务ID
   * @param {Function} callback - 回调函数
   */
  on(taskId, callback) {
    this.listeners.set(taskId, callback);
  }

  /**
   * 移除监听器
   * @param {string} taskId - 任务ID
   */
  off(taskId) {
    this.listeners.delete(taskId);
  }

  /**
   * 获取所有任务
   */
  getTasks() {
    return storageManager.get(STORAGE_KEY) || [];
  }

  /**
   * 保存任务
   */
  saveTasks(tasks) {
    storageManager.set(STORAGE_KEY, tasks);
  }

  /**
   * 获取指定任务
   */
  getTask(taskId) {
    const tasks = this.getTasks();
    return tasks.find((t) => t.id === taskId);
  }

  /**
   * 清理所有任务
   */
  async clearAll() {
    const tasks = this.getTasks();

    // 清除所有 alarms
    if (this.isExtension) {
      for (const task of tasks) {
        await this.clearExtensionAlarm(task.id);
      }
    }

    // 清除存储
    this.saveTasks([]);

    // 清除监听器
    this.listeners.clear();
  }

  /**
   * 销毁调度器
   */
  destroy() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    this.listeners.clear();
    this.initialized = false;
  }
}

// 导出单例
export default new TaskScheduler();
