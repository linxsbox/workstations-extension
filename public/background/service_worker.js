// ==================== RSS 定时刷新配置 ====================
// RSS 更新的时间点（24小时制）
const RSS_UPDATE_HOURS = [7, 8, 9, 10, 14, 18, 20, 22];
const RSS_SCHEDULER_ALARM = 'rss-scheduler';

// 初始化 RSS 定时器
const initRssScheduler = async () => {
  const alarm = await chrome.alarms.get(RSS_SCHEDULER_ALARM);

  if (!alarm) {
    // 每10分钟检查一次是否到了更新时间点
    chrome.alarms.create(RSS_SCHEDULER_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: 10
    });
    console.log('[RSS Scheduler] 定时器已创建');
  }
};

// 监听定时器触发
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === RSS_SCHEDULER_ALARM) {
    const currentHour = new Date().getHours();

    // 检查当前小时是否在更新时间点内
    if (RSS_UPDATE_HOURS.includes(currentHour)) {
      // 获取上次更新的小时，避免同一小时内重复更新
      chrome.storage.local.get('lastRssUpdateHour', (result) => {
        const lastUpdateHour = result.lastRssUpdateHour;

        if (lastUpdateHour !== currentHour) {
          console.log(`[RSS Scheduler] 触发更新 - 当前时间: ${currentHour}:00`);

          // 记录本次更新的小时
          chrome.storage.local.set({ lastRssUpdateHour: currentHour });

          // 向所有扩展页面发送更新消息
          chrome.runtime.sendMessage({
            type: 'RSS_UPDATE_TRIGGER',
            timestamp: Date.now(),
            hour: currentHour
          }).catch(err => {
            // 如果没有页面监听，忽略错误
            console.log('[RSS Scheduler] 没有活动页面监听更新消息');
          });
        }
      });
    }
  }
});

// 初始化定时器
initRssScheduler();

// ==================== ChromeStorage 工具类 ====================
class ChromeStorage {
  static async get(key, defaultValue = null) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key] ?? defaultValue);
      });
    });
  }

  static async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }

  static async checkAndInitialize(key, defaultValue) {
    const existingValue = await this.get(key);
    if (existingValue === null) {
      await this.set(key, defaultValue);
      return defaultValue;
    }
    return existingValue;
  }
}

// ==================== 扩展初始化 ====================
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // 检查是否已经设置过 useCustomNewTab
    const useCustomNewTab = await ChromeStorage.checkAndInitialize(
      "useCustomNewTab",
      false
    );

    const customNewTabUrl = await ChromeStorage.checkAndInitialize(
      "customNewTabUrl",
      chrome.runtime.getURL("index.html")
    );

    console.log("Initialized storage:", { useCustomNewTab, customNewTabUrl });
  } catch (error) {
    console.error("Initialization error:", error);
  }
});

chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (changes.useCustomNewTab) {
    try {
      const useCustomNewTab = changes.useCustomNewTab.newValue;
      const customNewTabUrl = await ChromeStorage.get(
        "customNewTabUrl",
        chrome.runtime.getURL("index.html")
      );

      const newTabUrl = useCustomNewTab
        ? customNewTabUrl
        : chrome.runtime.getURL("index.html");

      // 更新所有新标签页
      chrome.tabs.query({ url: "chrome://newtab/" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.update(tab.id, { url: newTabUrl });
        });
      });
    } catch (error) {
      console.error("New tab update error:", error);
    }
  }
});

// 可选：添加监听器确保新安装的标签页也能生效
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.url === "chrome://newtab/") {
    const useCustomNewTab = await ChromeStorage.get("useCustomNewTab", false);
    if (useCustomNewTab) {
      const customNewTabUrl = await ChromeStorage.get(
        "customNewTabUrl",
        chrome.runtime.getURL("index.html")
      );

      chrome.tabs.update(tab.id, { url: customNewTabUrl });
    }
  }
});

// ==================== 播放器管理 ====================
const PLAYER_LOCATION = {
  INDEX: 'index',
  OFFSCREEN: 'offscreen',
  NONE: 'none',
};

const MESSAGE_TYPES = {
  PLAY: 'PLAYER_PLAY',
  PAUSE: 'PLAYER_PAUSE',
  STOP: 'PLAYER_STOP',
  NEXT: 'PLAYER_NEXT',
  PREVIOUS: 'PLAYER_PREVIOUS',
  SEEK: 'PLAYER_SEEK',
  SET_VOLUME: 'PLAYER_SET_VOLUME',
  SET_PLAYBACK_RATE: 'PLAYER_SET_PLAYBACK_RATE',
  HANDOVER_TO_OFFSCREEN: 'HANDOVER_TO_OFFSCREEN',
  HANDOVER_TO_INDEX: 'HANDOVER_TO_INDEX',
  GET_PLAYER_STATE: 'GET_PLAYER_STATE',
  PLAYER_STATE_RESPONSE: 'PLAYER_STATE_RESPONSE',
  CREATE_OFFSCREEN: 'CREATE_OFFSCREEN',
  CLOSE_OFFSCREEN: 'CLOSE_OFFSCREEN',
  OFFSCREEN_READY: 'OFFSCREEN_READY',
};

// 当前播放器位置
let currentPlayerLocation = PLAYER_LOCATION.NONE;
let offscreenDocumentCreated = false;

/**
 * 创建 Offscreen Document
 */
async function createOffscreenDocument() {
  if (offscreenDocumentCreated) {
    console.log('[Player Manager] Offscreen document already exists');
    return true;
  }

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen/player.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Playing audio in background'
    });

    offscreenDocumentCreated = true;
    console.log('[Player Manager] Offscreen document created');
    return true;
  } catch (error) {
    console.error('[Player Manager] Failed to create offscreen document:', error);
    return false;
  }
}

/**
 * 关闭 Offscreen Document
 */
async function closeOffscreenDocument() {
  if (!offscreenDocumentCreated) {
    console.log('[Player Manager] No offscreen document to close');
    return true;
  }

  try {
    await chrome.offscreen.closeDocument();
    offscreenDocumentCreated = false;
    currentPlayerLocation = PLAYER_LOCATION.NONE;
    console.log('[Player Manager] Offscreen document closed');
    return true;
  } catch (error) {
    console.error('[Player Manager] Failed to close offscreen document:', error);
    return false;
  }
}

/**
 * 处理播放交接到 Offscreen
 */
async function handleHandoverToOffscreen(data) {
  console.log('[Player Manager] Handling handover to offscreen:', data);

  // 创建 Offscreen Document
  const created = await createOffscreenDocument();
  if (!created) {
    return { success: false, error: 'Failed to create offscreen document' };
  }

  // 从 storage 读取播放队列
  const queue = await new Promise((resolve) => {
    chrome.storage.local.get('PLAYER_PLAY_QUEUE', (result) => {
      resolve(result.PLAYER_PLAY_QUEUE || null);
    });
  });

  if (!queue || !queue.tracks) {
    console.error('[Player Manager] No queue found in storage');
    return { success: false, error: 'No queue found' };
  }

  // 找到对应的曲目
  const track = queue.tracks.find(t => t.id === data.trackId);
  if (!track) {
    console.error('[Player Manager] Track not found:', data.trackId);
    return { success: false, error: 'Track not found' };
  }

  console.log('[Player Manager] Found track:', track.title);

  // 等待一小段时间让 Offscreen Document 初始化
  await new Promise(resolve => setTimeout(resolve, 100));

  // 发送交接消息到 Offscreen Document，包含完整的曲目信息
  console.log('[Player Manager] Sending handover message to offscreen');
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.HANDOVER_TO_OFFSCREEN,
    data: {
      track: track,
      currentTime: data.currentTime
    }
  });

  console.log('[Player Manager] Received response from offscreen:', response);

  if (response && response.success) {
    currentPlayerLocation = PLAYER_LOCATION.OFFSCREEN;
    console.log('[Player Manager] Handover to offscreen successful');
  }

  return response;
}

/**
 * 消息监听器
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Player Manager] Received message:', message.type, message);

  switch (message.type) {
    case MESSAGE_TYPES.HANDOVER_TO_OFFSCREEN:
      console.log('[Player Manager] Handling handover to offscreen');
      handleHandoverToOffscreen(message.data).then(sendResponse);
      return true;

    case MESSAGE_TYPES.CLOSE_OFFSCREEN:
      console.log('[Player Manager] Closing offscreen');
      closeOffscreenDocument().then(sendResponse);
      return true;

    case MESSAGE_TYPES.OFFSCREEN_READY:
      console.log('[Player Manager] Offscreen document ready');
      sendResponse({ success: true });
      break;

    default:
      // 其他消息不处理，让原有逻辑继续
      break;
  }
});
