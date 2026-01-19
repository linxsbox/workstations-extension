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
      console.error("更新新标签页设置失败:", error);
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

  // 播放控制器
  const playerControl = document.getElementById("playerControl");
  const playerControls = playerControl.querySelector(".player-controls");
  const prevBtn = document.getElementById("prevBtn");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const nextBtn = document.getElementById("nextBtn");

  // 点击播放控制器标题，展开/收起控制按钮
  playerControl.querySelector(".flex.items-center").addEventListener("click", () => {
    const isHidden = playerControls.style.display === "none";
    playerControls.style.display = isHidden ? "flex" : "none";
  });

  // 播放控制按钮事件
  prevBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "PLAYER_PREVIOUS" });
  });

  playPauseBtn.addEventListener("click", () => {
    // TODO: 根据当前播放状态切换播放/暂停
    chrome.runtime.sendMessage({ type: "PLAYER_PLAY" });
  });

  nextBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "PLAYER_NEXT" });
  });

  // 打开进行的任务
  const openTasksBtn = document.getElementById("openTasks");
  openTasksBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkbenchWithPanel("TaskManager");
  });

  // 打开笔记
  const openNotesBtn = document.getElementById("openNotes");
  openNotesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkbenchWithPanel("Notes");
  });

  // 打开工作台并跳转到指定面板
  function openWorkbenchWithPanel(panelKey) {
    chrome.tabs.query(
      { url: chrome.runtime.getURL("index.html") },
      (tabs) => {
        if (tabs.length > 0) {
          // 已打开，切换到该标签并发送消息跳转面板
          chrome.tabs.update(tabs[0].id, { active: true });
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "SWITCH_PANEL",
            panelKey: panelKey
          });
        } else {
          // 未打开，创建新标签页（TODO: 需要在页面加载后跳转到指定面板）
          chrome.tabs.create({
            url: chrome.runtime.getURL("index.html")
          });
        }
      }
    );
  }
});
