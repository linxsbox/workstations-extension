// ==================== WebRTC P2P 通信模块 ====================
// 使用 Offscreen Document 来运行 WebRTC（因为 Service Worker 没有 window 对象）

let offscreenDocumentCreated = false;

// Offscreen 就绪事件监听器
let offscreenReadyResolve = null;

/**
 * 创建 Offscreen Document
 * @returns {Promise<boolean>}
 */
export const createOffscreenDocument = async () => {
  if (offscreenDocumentCreated) {
    return true;
  }

  try {
    // 检查是否已存在 offscreen document
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
      offscreenDocumentCreated = true;
      console.log('[Offscreen] Document 已存在');
      return true;
    }

    console.log('[Offscreen] 开始创建 Document...');

    // 创建 offscreen document
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('background/offscreen/service_offscreen.html'),
      reasons: ['WORKERS'],
      justification: 'WebRTC P2P communication requires DOM environment'
    });

    offscreenDocumentCreated = true;
    console.log('[Offscreen] Document 已创建（等待脚本加载）');
    return true;
  } catch (error) {
    console.error('[Offscreen] 创建 Document 失败:', error);
    return false;
  }
};

/**
 * 处理 Offscreen 就绪通知（由 Service Worker 的消息处理器调用）
 */
export const handleOffscreenReady = () => {
  console.log('[Offscreen] 收到就绪通知');
  if (offscreenReadyResolve) {
    offscreenReadyResolve(true);
    offscreenReadyResolve = null;
  }
};

/**
 * 等待 Offscreen Document 就绪
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>}
 */
export const waitForOffscreenReady = (timeout = 5000) => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn('[Offscreen] 等待就绪超时');
      offscreenReadyResolve = null;
      resolve(false);
    }, timeout);

    offscreenReadyResolve = (result) => {
      clearTimeout(timer);
      resolve(result);
    };
  });
};

/**
 * 重置 Offscreen Document 状态
 */
export const resetOffscreenDocument = () => {
  offscreenDocumentCreated = false;
};

/**
 * 保存 Peer ID 到存储
 * @param {string} peerId - Peer ID
 * @param {string} status - 连接状态
 * @returns {Promise<void>}
 */
export const savePeerId = async (peerId, status = 'connected') => {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      webrtc_peer_id: peerId,
      webrtc_status: status
    }, resolve);
  });
};

/**
 * 获取保存的 Peer ID
 * @returns {Promise<string|null>}
 */
export const getPeerId = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get('webrtc_peer_id', (result) => {
      resolve(result.webrtc_peer_id || null);
    });
  });
};

/**
 * 更新 WebRTC 状态
 * @param {string} status - 状态值
 * @param {string} error - 错误信息（可选）
 * @returns {Promise<void>}
 */
export const updateWebRTCStatus = async (status, error = null) => {
  return new Promise((resolve) => {
    const data = { webrtc_status: status };
    if (error) {
      data.webrtc_error = error;
    }
    chrome.storage.local.set(data, resolve);
  });
};

/**
 * 获取 WebRTC 状态
 * @returns {Promise<Object>}
 */
export const getWebRTCStatus = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['webrtc_status', 'webrtc_peer_id', 'webrtc_error'], (result) => {
      resolve({
        status: result.webrtc_status || 'disconnected',
        peerId: result.webrtc_peer_id || null,
        error: result.webrtc_error || null
      });
    });
  });
};

/**
 * 清除 WebRTC 数据
 * @returns {Promise<void>}
 */
export const clearWebRTCData = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['webrtc_peer_id', 'webrtc_status', 'webrtc_error'], resolve);
  });
};

/**
 * 检查是否需要自动恢复 WebRTC
 * @returns {Promise<boolean>}
 */
export const shouldAutoRestore = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['webrtc_auto_restore', 'webrtc_peer_id'], (result) => {
      const autoRestore = result.webrtc_auto_restore || false;
      const peerId = result.webrtc_peer_id || null;
      resolve(autoRestore && peerId !== null);
    });
  });
};

/**
 * 启用自动恢复
 * @returns {Promise<void>}
 */
export const enableAutoRestore = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ webrtc_auto_restore: true }, () => {
      console.log('[WebRTC] 已启用自动恢复');
      resolve();
    });
  });
};

/**
 * 禁用自动恢复
 * @returns {Promise<void>}
 */
export const disableAutoRestore = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ webrtc_auto_restore: false }, () => {
      console.log('[WebRTC] 已禁用自动恢复');
      resolve();
    });
  });
};

/**
 * 转发消息到 Offscreen Document
 * @param {Object} message - 消息对象
 * @returns {Promise<*>}
 */
export const forwardToOffscreen = async (message) => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * 广播 WebRTC 数据到所有扩展页面
 * @param {Object} data - 数据对象
 * @returns {Promise<void>}
 */
export const broadcastWebRTCData = async (data) => {
  try {
    await chrome.runtime.sendMessage({
      type: 'WEBRTC_DATA_RECEIVED',
      data
    });
  } catch (error) {
    console.log('[WebRTC] 广播数据失败（可能没有活动页面）:', error.message);
  }
};
