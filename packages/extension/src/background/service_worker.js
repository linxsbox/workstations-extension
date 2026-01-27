/**
 * Service Worker 入口
 */
import ChromeStorage from "../modules/storage.js";
import MessagingManager from "../modules/messaging.js";
import { createOffscreenDocument } from "../modules/offscreen.js";
import {
  initRssScheduler,
  setupSchedulerListener,
} from "../modules/scheduler.js";

console.log("[Service Worker] 启动");

/**
 * 初始化消息管理器
 */
const messagingManager = new MessagingManager();

/**
 * 注册消息处理器
 */
messagingManager.registerHandlers({});

/**
 * 设置消息监听器
 */
messagingManager.setupListener();

/**
 * 扩展安装/更新处理
 */
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log("[Service Worker] 扩展已安装");

    // 初始化 RSS 定时器
    await initRssScheduler();

    // 创建 Offscreen Document
    await createOffscreenDocument();
  } catch (error) {
    console.error("[Service Worker] 初始化失败:", error);
  }
});

/**
 * RSS 定时器监听
 */
setupSchedulerListener((updateInfo) => {
  console.log("[Service Worker] RSS 定时更新触发:", updateInfo);
});
