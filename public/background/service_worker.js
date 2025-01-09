const STORAGE_ALARM_KEY = "";
const config = {
  alarm: [STORAGE_ALARM_KEY, { delayInMinutes: 10, periodInMinutes: 10 }],
  local: { [STORAGE_ALARM_KEY]: true },
};

const useAlarm = async () => {
  const alarm = await chrome.alarms.get(STORAGE_ALARM_KEY);

  !alarm && chrome.alarms.create(...config.alarm);
};
useAlarm();

// const onInstalled = async () => {
//   if (!chrome) return;

//   chrome.runtime.onInstalled.addListener(async ({ reason }) => {
//     // if (reason !== 'install') return
//     await useAlarm();
//   });

//   // chrome.action.onClicked.addListener((tab) => {
//   //   chrome.tabs.create({ url: "" });
//   // });
// };

// onInstalled();

// use alarm

// utils/storage.js
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

// background/service_worker.js
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
