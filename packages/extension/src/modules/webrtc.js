// ==================== WebRTC P2P 通信模块 ====================
// 使用 Offscreen Document 来运行 WebRTC（因为 Service Worker 没有 window 对象）

let webrtcOffscreenCreated = false;

/**
 * 创建 WebRTC Offscreen Document
 * @returns {Promise<boolean>}
 */
export const createWebRTCOffscreen = async () => {
  if (webrtcOffscreenCreated) {
    return true;
  }

  try {
    // 检查是否已存在 offscreen document
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) {
      webrtcOffscreenCreated = true;
      console.log('[WebRTC] Offscreen Document 已存在');
      return true;
    }

    console.log('[WebRTC] 开始创建 Offscreen Document...');

    // 创建 offscreen document
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('background/offscreen/service_offscreen.html'),
      reasons: ['WORKERS'],
      justification: 'WebRTC P2P communication requires DOM environment'
    });

    webrtcOffscreenCreated = true;
    console.log('[WebRTC] Offscreen Document 已创建（等待脚本加载）');
    return true;
  } catch (error) {
    console.error('[WebRTC] 创建 Offscreen Document 失败:', error);
    return false;
  }
};

/**
 * 检查 WebRTC Offscreen 是否已创建
 * @returns {boolean}
 */
export const isWebRTCOffscreenCreated = () => webrtcOffscreenCreated;

/**
 * 重置 WebRTC Offscreen 状态
 */
export const resetWebRTCOffscreen = () => {
  webrtcOffscreenCreated = false;
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
