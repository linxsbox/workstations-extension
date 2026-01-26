// ==================== Service Worker 入口 ====================
import ChromeStorage from '../modules/storage.js';
import MessagingManager from '../modules/messaging.js';
import { initRssScheduler, setupSchedulerListener } from '../modules/scheduler.js';
import {
  createOffscreenDocument,
  waitForOffscreenReady,
  shouldAutoRestore,
  forwardToOffscreen
} from '../modules/webrtc.js';

// 导入模块处理器
import OffscreenHandler from './handlers/offscreen.js';
import WebRTCHandler from './handlers/webrtc.js';

console.log('[Service Worker] 启动');

// ==================== 初始化消息管理器 ====================
const messagingManager = new MessagingManager();

// ==================== 注册消息处理器 ====================
messagingManager.registerHandlers({
  // Offscreen 模块的消息总线
  'OFFSCREEN': async (message) => {
    return await OffscreenHandler.handle(message);
  },

  // WebRTC 模块的消息总线
  'WEBRTC': async (message) => {
    return await WebRTCHandler.handle(message);
  },
});

// 设置消息监听器
messagingManager.setupListener();

// ==================== 扩展安装/更新处理 ====================
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('[Service Worker] 扩展已安装');

    // 初始化存储配置
    const useCustomNewTab = await ChromeStorage.checkAndInitialize(
      'useCustomNewTab',
      false
    );

    const customNewTabUrl = await ChromeStorage.checkAndInitialize(
      'customNewTabUrl',
      chrome.runtime.getURL('index.html')
    );

    console.log('[Service Worker] 初始化存储:', { useCustomNewTab, customNewTabUrl });

    // 初始化 RSS 定时器
    await initRssScheduler();

    // 预创建 Offscreen Document（作为基础设施）
    console.log('[Service Worker] 预创建 Offscreen Document...');
    const offscreenSuccess = await createOffscreenDocument();
    if (offscreenSuccess) {
      const ready = await waitForOffscreenReady();
      if (ready) {
        console.log('[Service Worker] Offscreen Document 就绪');
      } else {
        console.warn('[Service Worker] Offscreen Document 就绪超时');
      }
    }
  } catch (error) {
    console.error('[Service Worker] 初始化失败:', error);
  }
});

// ==================== 存储变化监听 ====================
ChromeStorage.onChanged(async (changes, namespace) => {
  if (changes.useCustomNewTab) {
    try {
      const useCustomNewTab = changes.useCustomNewTab.newValue;
      const customNewTabUrl = await ChromeStorage.get(
        'customNewTabUrl',
        chrome.runtime.getURL('index.html')
      );

      const newTabUrl = useCustomNewTab
        ? customNewTabUrl
        : chrome.runtime.getURL('index.html');

      // 更新所有新标签页
      chrome.tabs.query({ url: 'chrome://newtab/' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.update(tab.id, { url: newTabUrl });
        });
      });
    } catch (error) {
      console.error('[Service Worker] 新标签页更新失败:', error);
    }
  }
});

// ==================== 新标签页创建处理 ====================
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.url === 'chrome://newtab/') {
    const useCustomNewTab = await ChromeStorage.get('useCustomNewTab', false);
    if (useCustomNewTab) {
      const customNewTabUrl = await ChromeStorage.get(
        'customNewTabUrl',
        chrome.runtime.getURL('index.html')
      );

      chrome.tabs.update(tab.id, { url: customNewTabUrl });
    }
  }
});

// ==================== RSS 定时器监听 ====================
setupSchedulerListener((updateInfo) => {
  console.log('[Service Worker] RSS 定时更新触发:', updateInfo);
});

// ==================== 浏览器启动时自动恢复 WebRTC ====================
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Service Worker] 浏览器启动');

  try {
    // 检查 Offscreen 是否存在
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length === 0) {
      // 预创建 Offscreen Document（作为基础设施）
      console.log('[Service Worker] 预创建 Offscreen Document...');
      const success = await createOffscreenDocument();
      if (success) {
        const ready = await waitForOffscreenReady();
        if (ready) {
          console.log('[Service Worker] Offscreen Document 就绪');

          // 检查是否需要自动恢复 WebRTC
          const needRestore = await shouldAutoRestore();
          if (needRestore) {
            console.log('[Service Worker] 检测到需要自动恢复 WebRTC');
            await forwardToOffscreen({ type: 'WEBRTC_INIT' });
            console.log('[Service Worker] WebRTC 已自动恢复');
          }
        } else {
          console.warn('[Service Worker] Offscreen 就绪超时');
        }
      }
    } else {
      console.log('[Service Worker] Offscreen Document 已存在');

      // 检查是否需要自动恢复 WebRTC
      const needRestore = await shouldAutoRestore();
      if (needRestore) {
        console.log('[Service Worker] 检测到需要自动恢复 WebRTC');
        await forwardToOffscreen({ type: 'WEBRTC_INIT' });
        console.log('[Service Worker] WebRTC 已自动恢复');
      }
    }
  } catch (error) {
    console.error('[Service Worker] 启动处理失败:', error);
  }
});

// ==================== 定期心跳检查 ====================
// 创建定时器（每 5 分钟检查一次）
chrome.alarms.create('webrtc_heartbeat', {
  periodInMinutes: 5
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'webrtc_heartbeat') {
    console.log('[Service Worker] WebRTC 心跳检查');

    try {
      const needRestore = await shouldAutoRestore();

      if (needRestore) {
        // 检查 Offscreen 是否还在运行
        const existingContexts = await chrome.runtime.getContexts({
          contextTypes: ['OFFSCREEN_DOCUMENT']
        });

        if (existingContexts.length === 0) {
          console.log('[Service Worker] 检测到 Offscreen 已关闭，重新创建');
          const success = await createOffscreenDocument();
          if (success) {
            // 等待就绪通知
            const ready = await waitForOffscreenReady();
            if (ready) {
              // 发送初始化消息
              await forwardToOffscreen({ type: 'WEBRTC_INIT' });
              console.log('[Service Worker] Offscreen 已恢复');
            } else {
              console.error('[Service Worker] Offscreen 就绪超时');
            }
          } else {
            console.error('[Service Worker] Offscreen 恢复失败');
          }
        } else {
          console.log('[Service Worker] Offscreen 运行正常');
        }
      }
    } catch (error) {
      console.error('[Service Worker] 心跳检查失败:', error);
    }
  }
});
