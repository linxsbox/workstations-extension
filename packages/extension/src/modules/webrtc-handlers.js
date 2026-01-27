/**
 * WebRTC 消息处理器模块
 * 提供插件化的消息处理功能
 */

import ChromeStorage from './storage.js';

// ==================== 处理器注册表 ====================

/**
 * 处理器基类接口
 * @typedef {Object} HandlerResult
 * @property {boolean} success - 是否成功
 * @property {string} [message] - 消息
 * @property {*} [data] - 返回数据
 * @property {string} [error] - 错误信息
 */

/**
 * 处理器函数类型
 * @typedef {function(Object): Promise<HandlerResult>} HandlerFunction
 */

// ==================== 内置处理器 ====================

/**
 * 笔记处理器
 * 处理来自手机的笔记保存请求
 */
async function handleNote(data) {
  try {
    console.log('[WebRTC Handler] 处理笔记保存:', data);

    // 获取现有笔记
    const notes = await ChromeStorage.get('notes', []);

    // 创建新笔记
    const newNote = {
      content: data.content,
      title: data.title || '来自手机的笔记',
      timestamp: data.timestamp || Date.now(),
      source: 'mobile',
      synced: true
    };

    // 添加到笔记列表
    notes.push(newNote);

    // 保存回存储
    await ChromeStorage.set('notes', notes);

    console.log('[WebRTC Handler] 笔记已保存');

    return {
      success: true,
      message: '笔记已保存',
      data: newNote
    };
  } catch (error) {
    console.error('[WebRTC Handler] 保存笔记失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 打开标签页处理器
 * 处理打开新标签页的请求
 */
async function handleOpenTab(data) {
  try {
    console.log('[WebRTC Handler] 打开标签页:', data.url);

    if (!data.url) {
      return {
        success: false,
        error: '缺少 URL 参数'
      };
    }

    // 创建新标签页
    const tab = await chrome.tabs.create({
      url: data.url,
      active: data.active !== false // 默认激活
    });

    return {
      success: true,
      message: '标签页已打开',
      data: {
        tabId: tab.id,
        url: tab.url
      }
    };
  } catch (error) {
    console.error('[WebRTC Handler] 打开标签页失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取标签页列表处理器
 */
async function handleGetTabs(data) {
  try {
    console.log('[WebRTC Handler] 获取标签页列表');

    const tabs = await chrome.tabs.query({});

    // 只返回必要信息
    const tabList = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      pinned: tab.pinned
    }));

    return {
      success: true,
      message: `找到 ${tabList.length} 个标签页`,
      data: tabList
    };
  } catch (error) {
    console.error('[WebRTC Handler] 获取标签页失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 关闭标签页处理器
 */
async function handleCloseTab(data) {
  try {
    console.log('[WebRTC Handler] 关闭标签页:', data.tabId);

    if (!data.tabId) {
      return {
        success: false,
        error: '缺少 tabId 参数'
      };
    }

    await chrome.tabs.remove(data.tabId);

    return {
      success: true,
      message: '标签页已关闭'
    };
  } catch (error) {
    console.error('[WebRTC Handler] 关闭标签页失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 剪贴板处理器
 */
async function handleClipboard(data) {
  try {
    console.log('[WebRTC Handler] 处理剪贴板:', data.action);

    if (data.action === 'write') {
      // 写入剪贴板（需要在 Offscreen Document 中实现）
      return {
        success: false,
        error: '剪贴板写入功能需要在 Offscreen Document 中实现'
      };
    } else if (data.action === 'read') {
      // 读取剪贴板（需要在 Offscreen Document 中实现）
      return {
        success: false,
        error: '剪贴板读取功能需要在 Offscreen Document 中实现'
      };
    }

    return {
      success: false,
      error: '未知的剪贴板操作'
    };
  } catch (error) {
    console.error('[WebRTC Handler] 剪贴板操作失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ==================== 处理器注册表 ====================

/**
 * WebRTC 消息处理器映射表
 * 键：消息类型
 * 值：处理器函数
 */
export const webrtcHandlers = {
  'NOTE': handleNote,
  'OPEN_TAB': handleOpenTab,
  'GET_TABS': handleGetTabs,
  'CLOSE_TAB': handleCloseTab,
  'CLIPBOARD': handleClipboard,
};

/**
 * 注册自定义处理器
 * @param {string} type - 消息类型
 * @param {HandlerFunction} handler - 处理器函数
 */
export function registerHandler(type, handler) {
  if (typeof handler !== 'function') {
    throw new Error('处理器必须是函数');
  }

  webrtcHandlers[type] = handler;
  console.log(`[WebRTC Handlers] 已注册处理器: ${type}`);
}

/**
 * 注销处理器
 * @param {string} type - 消息类型
 */
export function unregisterHandler(type) {
  delete webrtcHandlers[type];
  console.log(`[WebRTC Handlers] 已注销处理器: ${type}`);
}

/**
 * 获取所有已注册的处理器类型
 * @returns {string[]}
 */
export function getRegisteredTypes() {
  return Object.keys(webrtcHandlers);
}

/**
 * 执行处理器
 * @param {string} type - 消息类型
 * @param {Object} data - 消息数据
 * @returns {Promise<HandlerResult>}
 */
export async function executeHandler(type, data) {
  const handler = webrtcHandlers[type];

  if (!handler) {
    console.warn(`[WebRTC Handlers] 未找到处理器: ${type}`);
    return {
      success: false,
      error: `未知的消息类型: ${type}`
    };
  }

  try {
    return await handler(data);
  } catch (error) {
    console.error(`[WebRTC Handlers] 执行处理器失败 (${type}):`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

