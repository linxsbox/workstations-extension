

import { Logger } from "@linxs/toolkit";

const logger = new Logger('RSS Scheduler', { showTimestamp: false });



// 使用 chrome.alarms API 实现定时任务
const RSS_UPDATE_HOURS = [7, 8, 9, 10, 14, 18, 20, 22];
const RSS_SCHEDULER_ALARM = 'rss-scheduler';

/**
 * 初始化 RSS 定时器
 * 每10分钟检查一次是否到了更新时间点
 */
export const initRssScheduler = async () => {
  try {
    const alarm = await chrome.alarms.get(RSS_SCHEDULER_ALARM);

    if (!alarm) {
      chrome.alarms.create(RSS_SCHEDULER_ALARM, {
        delayInMinutes: 1,
        periodInMinutes: 10
      });
      logger.info('定时器已创建');
    }
  } catch (error) {
    logger.error('初始化失败:', error);
  }
};

/**
 * 设置定时器监听器
 * @param {Function} onUpdate - 触发更新时的回调函数
 */
export const setupSchedulerListener = (onUpdate) => {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === RSS_SCHEDULER_ALARM) {
      const currentHour = new Date().getHours();

      // 检查当前小时是否在更新时间点内
      if (RSS_UPDATE_HOURS.includes(currentHour)) {
        // 获取上次更新的小时，避免同一小时内重复更新
        const result = await chrome.storage.local.get('lastRssUpdateHour');
        const lastUpdateHour = result.lastRssUpdateHour;

        if (lastUpdateHour !== currentHour) {
          logger.info(`触发更新 - 当前时间: ${currentHour}:00`);

          // 记录本次更新的小时
          await chrome.storage.local.set({ lastRssUpdateHour: currentHour });

          // 执行回调
          if (onUpdate) {
            onUpdate({
              timestamp: Date.now(),
              hour: currentHour
            });
          }

          // 向所有扩展页面发送更新消息
          try {
            await chrome.runtime.sendMessage({
              type: 'RSS_UPDATE_TRIGGER',
              timestamp: Date.now(),
              hour: currentHour
            });
          } catch (err) {
            // 如果没有页面监听，忽略错误
            logger.info('没有活动页面监听更新消息');
          }
        }
      }
    }
  });
};

/**
 * 获取 RSS 更新时间点配置
 */
export const getRssUpdateHours = () => RSS_UPDATE_HOURS;

/**
 * 清除定时器
 */
export const clearRssScheduler = async () => {
  try {
    await chrome.alarms.clear(RSS_SCHEDULER_ALARM);
    logger.info('定时器已清除');
  } catch (error) {
    logger.error('清除失败:', error);
  }
};
