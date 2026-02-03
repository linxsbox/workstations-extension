import { Logger } from '@linxs/toolkit';
import ChromeStorage from '../modules/storage.js';
import MessagingManager from '../modules/messaging.js';
import { createOffscreenDocument } from '../modules/offscreen.js';
import {
  initRssScheduler,
  setupSchedulerListener,
} from '../modules/scheduler.js';
import { SERVICE_NAME } from 'pkg-utils/constants';

const logger = new Logger('Service Worker');

/**
 * 初始化消息管理器
 */
const messagingManager = new MessagingManager();

/**
 * 注册消息处理器
 */
messagingManager.registerHandlers({
  [SERVICE_NAME.SERVICE_WORKER]: async (message) => {
    return null;
  },
});

/**
 * 设置消息监听器
 */
messagingManager.setupListener();

/**
 * 扩展安装/更新处理
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    logger.info('扩展已安装/更新, 原因:', details.reason);

    // 根据不同的原因执行不同的操作
    if (details.reason === 'install') {
      logger.info('首次安装');
    } else if (details.reason === 'update') {
      logger.info('扩展更新, 旧版本:', details.previousVersion);
    }

    // 初始化 RSS 定时器
    await initRssScheduler();

    // 创建 Offscreen Document
    await createOffscreenDocument();
  } catch (error) {
    logger.error('初始化失败:', error);
  }
});

/**
 * 浏览器启动处理
 * 当浏览器启动时触发（扩展随浏览器启动而加载）
 */
chrome.runtime.onStartup.addListener(async () => {
  try {
    logger.info('浏览器启动');

    // 创建 Offscreen Document
    await createOffscreenDocument();
  } catch (error) {
    logger.error('启动初始化失败:', error);
  }
});

/**
 * RSS 定时器监听
 */
setupSchedulerListener((updateInfo) => {
  logger.info('RSS 定时更新触发:', updateInfo);
});
