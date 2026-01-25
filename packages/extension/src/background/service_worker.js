// ==================== Service Worker 入口 ====================
import ChromeStorage from '../modules/storage.js';
import MessagingManager from '../modules/messaging.js';
import { initRssScheduler, setupSchedulerListener } from '../modules/scheduler.js';
import {
  createWebRTCOffscreen,
  savePeerId,
  updateWebRTCStatus,
  forwardToOffscreen,
  broadcastWebRTCData
} from '../modules/webrtc.js';

console.log('[Service Worker] 启动');

// ==================== 初始化消息管理器 ====================
const messagingManager = new MessagingManager();

// ==================== 注册消息处理器 ====================
messagingManager.registerHandlers({
  // WebRTC 初始化
  'INIT_WEBRTC': async (message) => {
    console.log('[Service Worker] 收到 INIT_WEBRTC 请求');
    const success = await createWebRTCOffscreen();
    return { success };
  },

  // 保存 Peer ID
  'WEBRTC_SAVE_PEER_ID': async (message) => {
    console.log('[Service Worker] 保存 Peer ID:', message.peerId);
    await savePeerId(message.peerId, message.status);
    return { success: true };
  },

  // 更新 WebRTC 状态
  'WEBRTC_UPDATE_STATUS': async (message) => {
    console.log('[Service Worker] 更新 WebRTC 状态:', message.status);
    await updateWebRTCStatus(message.status, message.error);
    return { success: true };
  },

  // WebRTC 就绪通知
  'WEBRTC_READY': async (message) => {
    console.log('[Service Worker] WebRTC 已就绪, Peer ID:', message.peerId);
    // 只保存 Peer ID 和状态到 session storage
    await ChromeStorage.set('webrtc_peer_id', message.peerId);
    await ChromeStorage.set('webrtc_status', message.status || 'ready');

    // 广播给所有扩展页面
    try {
      await chrome.runtime.sendMessage({
        type: 'WEBRTC_READY',
        peerId: message.peerId,
        status: message.status || 'ready'
      });
    } catch (error) {
      console.log('[Service Worker] 广播 WEBRTC_READY 失败（可能没有活动页面）:', error.message);
    }

    return { success: true };
  },

  // WebRTC 连接建立
  'WEBRTC_CONNECTED': async (message) => {
    console.log('[Service Worker] WebRTC 连接已建立');
    await ChromeStorage.set('webrtc_status', message.status);
    return { success: true };
  },

  // WebRTC 连接断开
  'WEBRTC_DISCONNECTED': async (message) => {
    console.log('[Service Worker] WebRTC 连接已断开');
    await ChromeStorage.set('webrtc_status', message.status);
    return { success: true };
  },

  // WebRTC 错误
  'WEBRTC_ERROR': async (message) => {
    console.error('[Service Worker] WebRTC 错误:', message.error);
    await ChromeStorage.set('webrtc_status', message.status);
    await ChromeStorage.set('webrtc_error', message.error);
    return { success: true };
  },

  // 保存笔记
  'WEBRTC_SAVE_NOTE': async (message) => {
    console.log('[Service Worker] 保存来自手机的笔记');
    try {
      // 获取现有笔记
      const notes = await ChromeStorage.get('notes', []);
      // 添加新笔记
      notes.push(message.note);
      // 保存回存储
      await ChromeStorage.set('notes', notes);
      console.log('[Service Worker] 笔记已保存');
      return { success: true };
    } catch (error) {
      console.error('[Service Worker] 保存笔记失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 接收到数据
  'WEBRTC_DATA_RECEIVED': async (message) => {
    console.log('[Service Worker] 收到 WebRTC 数据:', message.data);
    // 广播给所有扩展页面
    await broadcastWebRTCData(message.data);
    return { success: true };
  },

  // 发送数据到手机
  'WEBRTC_SEND_DATA': async (message) => {
    console.log('[Service Worker] 转发数据到 Offscreen');
    const response = await forwardToOffscreen(message);
    return response;
  },

  // 重置 WebRTC
  'WEBRTC_RESET': async (message) => {
    console.log('[Service Worker] 重置 WebRTC');
    const response = await forwardToOffscreen(message);
    return response;
  },

  // 断开 WebRTC 连接
  'WEBRTC_DISCONNECT': async (message) => {
    console.log('[Service Worker] 断开 WebRTC 连接');
    const response = await forwardToOffscreen(message);
    return response;
  }
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
