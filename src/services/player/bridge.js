/**
 * 播放器桥接服务
 * 处理扩展环境下的播放交接（index ↔ Offscreen）
 */

import { MESSAGE_TYPES } from './constants.js';

/**
 * 检测是否在扩展环境
 */
export function isExtensionEnvironment() {
  return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
}

/**
 * 播放交接到 Offscreen Document
 * @param {string} trackId - 当前播放的曲目 ID
 * @param {number} currentTime - 当前播放时间
 */
export async function handoverToOffscreen(trackId, currentTime) {
  if (!isExtensionEnvironment()) {
    console.warn('[Player Bridge] Not in extension environment');
    return { success: false, error: 'Not in extension environment' };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.HANDOVER_TO_OFFSCREEN,
      data: { trackId, currentTime }
    });

    return response;
  } catch (error) {
    console.error('[Player Bridge] Handover failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取 Offscreen 播放器状态
 */
export async function getOffscreenPlayerState() {
  if (!isExtensionEnvironment()) {
    return null;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_PLAYER_STATE
    });

    return response;
  } catch (error) {
    console.error('[Player Bridge] Get state failed:', error);
    return null;
  }
}

/**
 * 关闭 Offscreen Document
 */
export async function closeOffscreen() {
  if (!isExtensionEnvironment()) {
    return { success: false };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.CLOSE_OFFSCREEN
    });

    return response;
  } catch (error) {
    console.error('[Player Bridge] Close offscreen failed:', error);
    return { success: false, error: error.message };
  }
}
