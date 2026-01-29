// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const useCustomNewTabCheckbox = document.getElementById("useCustomNewTab");

  // 初始化时读取存储的设置
  chrome.storage.sync.get(["useCustomNewTab"], (result) => {
    // 默认不勾选
    useCustomNewTabCheckbox.checked = result.useCustomNewTab || false;
  });

  // 监听开关变化
  useCustomNewTabCheckbox.addEventListener("change", async (e) => {
    const isChecked = e.target.checked;

    try {
      // 更新存储
      await ChromeStorage.set("useCustomNewTab", isChecked);

      // 如果启用，设置默认的新标签页
      if (isChecked) {
        await ChromeStorage.set(
          "customNewTabUrl",
          chrome.runtime.getURL("index.html")
        );
      }
    } catch (error) {
      logger.error("更新新标签页设置失败:", error);
    }
  });

  // 打开工作台
  const openWorkbenchBtn = document.getElementById("openWorkbench");
  openWorkbenchBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // 查找已经打开的主页
    chrome.tabs.query(
      {
        url: chrome.runtime.getURL("index.html"),
      },
      (tabs) => {
        if (tabs.length > 0) {
          // 如果已经打开，直接切换到该标签
          chrome.tabs.update(tabs[0].id, { active: true });
        } else {
          // 如果没有打开，创建新标签页
          chrome.tabs.create({
            url: chrome.runtime.getURL("index.html"),
          });
        }
      }
    );
  });
});
