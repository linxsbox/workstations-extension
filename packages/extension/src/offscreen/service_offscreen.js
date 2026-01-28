import {
  WEBRTC_ACTIONS,
  AUDIO_ACTIONS,
  ONNX_ACTIONS,
} from "pkg-utils/constants";
import { WebRTCManager, WebRTCActionHandler } from "../modules/webrtc.js";

const offscreenManager = new Map();

const ALLOWED_MODULES = [
  WEBRTC_ACTIONS.MODULE_NAME,
  AUDIO_ACTIONS.MODULE_NAME,
  ONNX_ACTIONS.MODULE_NAME,
];

/**
 * 初始化模块并保存到 offscreenManager
 */
function initModule(moduleName) {
  if (offscreenManager.has(moduleName)) {
    return offscreenManager.get(moduleName);
  }

  let handler;

  switch (moduleName) {
    case WEBRTC_ACTIONS.MODULE_NAME:
      const webrtcManager = new WebRTCManager();
      handler = new WebRTCActionHandler(webrtcManager);
      break;

    case AUDIO_ACTIONS.MODULE_NAME:
      // TODO: 实现 Audio 模块
      break;

    case ONNX_ACTIONS.MODULE_NAME:
      // TODO: 实现 Onnx 模块
      break;

    default:
      return null;
  }

  if (handler) {
    offscreenManager.set(moduleName, handler);
  }

  return handler;
}

/**
 * 监听来自 Service Worker 的消息
 * 只接受运行在 Offscreen Document 环境下的模块消息：WebRTC、Audio、Onnx
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { module, action, data } = message;

  // 检查消息是否来自允许的模块
  if (!module || !ALLOWED_MODULES.includes(module)) {
    console.warn("[Offscreen] 拒绝未知模块的消息:", module);
    sendResponse({ success: false, error: "未知的模块" });
    return false;
  }

  // 检查是否有 action
  if (!action) {
    console.warn("[Offscreen] 消息缺少 action 字段");
    sendResponse({ success: false, error: "缺少 action 字段" });
    return false;
  }

  console.log(`[Offscreen] 接收到消息 - 模块: ${module}, 动作: ${action}`);

  // 处理 INIT 动作：初始化模块
  if (action === 'INIT') {
    const handler = initModule(module);
    if (handler && handler.manager && handler.manager.init) {
      handler.manager.init().then((result) => {
        sendResponse(result);
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    } else {
      sendResponse({ success: false, error: "模块初始化失败" });
      return false;
    }
  }

  // 处理其他动作：分发到对应的处理器
  const handler = offscreenManager.get(module);
  if (!handler) {
    sendResponse({ success: false, error: "模块未初始化" });
    return false;
  }

  handler.handle({ action, data }).then((result) => {
    sendResponse(result);
  }).catch((error) => {
    sendResponse({ success: false, error: error.message });
  });

  return true;
});
