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
