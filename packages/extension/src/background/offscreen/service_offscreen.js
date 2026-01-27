/**
 * WebRTC Offscreen Document
 * 在 offscreen document 中运行 WebRTC 逻辑
 */

console.log('[WebRTC Offscreen] 脚本开始加载...');
console.log('[WebRTC Offscreen] Peer 是否可用:', typeof Peer !== 'undefined');

class WebRTCOffscreen {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.peerId = null;
    this.localIP = null;
    this.isResetting = false; // 标志：是否正在重置
  }

  // 生成随机 Peer ID
  generatePeerId() {
    return 'ext-' + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * 从 storage 获取已保存的 Peer ID（通过 Service Worker）
   * @returns {Promise<string|null>}
   */
  async getSavedPeerId() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'WEBRTC',
        action: 'GET_PEER_ID'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[WebRTC Offscreen] 获取 Peer ID 失败:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response?.data?.peerId || null);
        }
      });
    });
  }

  /**
   * 保存 Peer ID 到 storage（通过 Service Worker）
   * @param {string} peerId
   * @returns {Promise<void>}
   */
  async savePeerIdToStorage(peerId) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'WEBRTC',
        action: 'SAVE_PEER_ID',
        data: { peerId }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[WebRTC Offscreen] 保存 Peer ID 失败:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('[WebRTC Offscreen] Peer ID 已保存到 storage');
          resolve();
        }
      });
    });
  }

  // 通过 WebRTC 获取本地 IP
  async getLocalIP() {
    return new Promise((resolve, reject) => {
      const pc = new RTCPeerConnection({
        iceServers: []
      });

      pc.createDataChannel('');

      pc.createOffer().then(offer => pc.setLocalDescription(offer));

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          return;
        }

        const candidate = ice.candidate.candidate;
        // 匹配 IPv4 地址
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(candidate);

        if (match) {
          const localIP = match[1];
          // 过滤掉 127.0.0.1
          if (localIP !== '127.0.0.1') {
            pc.close();
            resolve(localIP);
          }
        }
      };

      setTimeout(() => {
        pc.close();
        reject(new Error('获取 IP 超时'));
      }, 3000);
    });
  }

  async init() {
    try {
      console.log('[WebRTC Offscreen] 初始化...');

      // 通过 Service Worker 获取已保存的 Peer ID
      const savedPeerId = await this.getSavedPeerId();

      let peerId;
      if (savedPeerId) {
        console.log('[WebRTC Offscreen] 复用已保存的 Peer ID:', savedPeerId);
        peerId = savedPeerId;
      } else {
        // 生成新的 Peer ID
        peerId = this.generatePeerId();
        console.log('[WebRTC Offscreen] 生成新 Peer ID:', peerId);

        // 通过 Service Worker 保存到 storage
        await this.savePeerIdToStorage(peerId);
      }

      // 创建 Peer 实例，使用指定的 ID
      this.peer = new Peer(peerId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      // 监听 Peer 打开事件
      this.peer.on('open', (id) => {
        this.peerId = id;
        console.log('[WebRTC Offscreen] Peer ID 已创建:', id);

        // 只通知 Peer ID，不生成 URL
        chrome.runtime.sendMessage({
          type: 'WEBRTC_READY',
          peerId: id,
          status: 'ready'
        }).catch(err => {
          console.error('[WebRTC Offscreen] 发送消息失败:', err);
        });
      });

      // 监听连接请求
      this.peer.on('connection', (conn) => {
        console.log('[WebRTC Offscreen] 收到连接请求');
        this.handleConnection(conn);
      });

      // 监听错误
      this.peer.on('error', (err) => {
        console.error('[WebRTC Offscreen] 错误:', err);

        // 通知 service worker 更新状态
        chrome.runtime.sendMessage({
          type: 'WEBRTC_ERROR',
          error: err.message,
          status: 'error'
        }).catch(e => {
          console.error('[WebRTC Offscreen] 发送错误消息失败:', e);
        });
      });

      return true;
    } catch (error) {
      console.error('[WebRTC Offscreen] 初始化失败:', error);
      return false;
    }
  }

  handleConnection(conn) {
    this.connection = conn;

    conn.on('open', () => {
      console.log('[WebRTC Offscreen] 连接已建立');

      // 通知 service worker 更新状态
      chrome.runtime.sendMessage({
        type: 'WEBRTC_CONNECTED',
        status: 'connected'
      }).catch(err => {
        console.error('[WebRTC Offscreen] 发送连接消息失败:', err);
      });

      // 发送欢迎消息
      conn.send({
        type: 'WELCOME',
        message: '已连接到扩展'
      });
    });

    conn.on('data', (data) => {
      console.log('[WebRTC Offscreen] 收到数据:', data);
      this.handleReceivedData(data);
    });

    conn.on('close', () => {
      console.log('[WebRTC Offscreen] 连接已关闭');
      this.connection = null;

      // 只有在非重置状态下才发送 DISCONNECTED 消息
      if (!this.isResetting) {
        // 通知 service worker 更新状态
        chrome.runtime.sendMessage({
          type: 'WEBRTC_DISCONNECTED',
          status: 'disconnected'
        }).catch(err => {
          console.error('[WebRTC Offscreen] 发送断开消息失败:', err);
        });
      } else {
        console.log('[WebRTC Offscreen] 重置中，跳过发送 DISCONNECTED 消息');
      }
    });

    conn.on('error', (err) => {
      console.error('[WebRTC Offscreen] 连接错误:', err);
    });
  }

  async handleReceivedData(data) {
    if (!data || !data.type) {
      console.warn('[WebRTC Offscreen] 无效的数据格式');
      return;
    }

    // 心跳检测（通信层功能）
    if (data.type === 'PING') {
      this.sendResponse({
        type: 'PONG',
        timestamp: Date.now()
      });
      return;
    }

    // 其他消息转发到 Service Worker 处理
    try {
      const result = await this.forwardToServiceWorker(data);

      // 将结果返回给手机
      if (result && result.success) {
        this.sendResponse({
          type: 'SUCCESS',
          message: result.message || '操作成功',
          data: result.data,
          timestamp: Date.now()
        });
      } else {
        this.sendResponse({
          type: 'ERROR',
          message: result?.error || '操作失败',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('[WebRTC Offscreen] 转发消息失败:', error);
      this.sendResponse({
        type: 'ERROR',
        message: error.message,
        timestamp: Date.now()
      });
    }
  }

  async forwardToServiceWorker(data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'WEBRTC_MESSAGE',
        data: data,
        timestamp: Date.now()
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  sendResponse(data) {
    if (!this.connection) {
      console.warn('[WebRTC Offscreen] 没有活动连接');
      return;
    }

    try {
      this.connection.send(data);
      console.log('[WebRTC Offscreen] 已发送响应:', data);
    } catch (error) {
      console.error('[WebRTC Offscreen] 发送失败:', error);
    }
  }

  /**
   * 内部清理方法（不发送消息）
   */
  cleanup() {
    console.log('[WebRTC Offscreen] 清理资源...');

    if (this.connection) {
      // 移除所有事件监听器，避免触发 close 事件发送消息
      this.connection.removeAllListeners();
      this.connection.close();
      this.connection = null;
    }

    if (this.peer) {
      // 移除所有事件监听器
      this.peer.removeAllListeners();
      this.peer.destroy();
      this.peer = null;
    }

    this.peerId = null;

    console.log('[WebRTC Offscreen] 资源已清理');
  }

  /**
   * 断开当前连接（但保持 Peer 监听）
   */
  disconnect() {
    console.log('[WebRTC Offscreen] 断开当前连接（保持 Peer 监听）...');

    // 只关闭当前连接，不销毁 Peer
    if (this.connection) {
      this.connection.removeAllListeners();
      this.connection.close();
      this.connection = null;
      console.log('[WebRTC Offscreen] 连接已关闭');
    }

    // 通知 Service Worker（状态改为 ready，表示可以重新连接）
    chrome.runtime.sendMessage({
      type: 'WEBRTC_DISCONNECTED',
      status: 'ready'
    }).catch(err => {
      console.error('[WebRTC Offscreen] 发送断开消息失败:', err);
    });
  }

  /**
   * 完全关闭（销毁 Peer 实例）
   */
  shutdown() {
    console.log('[WebRTC Offscreen] 完全关闭...');

    // 清理所有资源
    this.cleanup();

    // 通知 Service Worker
    chrome.runtime.sendMessage({
      type: 'WEBRTC_SHUTDOWN',
      status: 'idle'
    }).catch(err => {
      console.error('[WebRTC Offscreen] 发送关闭消息失败:', err);
    });
  }

  /**
   * 重置并重新初始化
   */
  async reset() {
    console.log('[WebRTC Offscreen] 重置连接...');

    // 设置重置标志，避免发送 DISCONNECTED 消息
    this.isResetting = true;

    // 清理资源（不发送 DISCONNECTED 消息）
    this.cleanup();

    // 重新初始化
    await this.init();

    // 清除重置标志
    this.isResetting = false;

    console.log('[WebRTC Offscreen] 重置完成');
  }
}

// 创建实例（不自动初始化）
console.log('[WebRTC Offscreen] 准备创建实例...');
const webrtcOffscreen = new WebRTCOffscreen();
console.log('[WebRTC Offscreen] 实例已创建，等待初始化指令...');

// 不再自动初始化，等待 Service Worker 的 WEBRTC_INIT 消息

// 通知 Service Worker：Offscreen Document 已就绪
chrome.runtime.sendMessage({
  type: 'OFFSCREEN',
  action: 'READY'
}).then(() => {
  console.log('[WebRTC Offscreen] 已通知 Service Worker 就绪');
}).catch((error) => {
  console.error('[WebRTC Offscreen] 通知就绪失败:', error);
});

// 监听来自 Service Worker 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 只处理发给 Offscreen 的消息
  const offscreenMessages = ['WEBRTC_INIT', 'WEBRTC_DISCONNECT', 'WEBRTC_SHUTDOWN', 'WEBRTC_RESET', 'WEBRTC_SEND_DATA'];

  if (!offscreenMessages.includes(message.type)) {
    // 不是发给 Offscreen 的消息，忽略
    return false;
  }

  console.log('[WebRTC Offscreen] 收到消息:', message.type);

  switch (message.type) {
    case 'WEBRTC_INIT':
      webrtcOffscreen.init().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('[WebRTC Offscreen] 初始化失败:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // 异步响应

    case 'WEBRTC_DISCONNECT':
      webrtcOffscreen.disconnect();
      sendResponse({ success: true });
      break;

    case 'WEBRTC_SHUTDOWN':
      webrtcOffscreen.shutdown();
      sendResponse({ success: true });
      break;

    case 'WEBRTC_RESET':
      webrtcOffscreen.reset().then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('[WebRTC Offscreen] 重置失败:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true; // 异步响应

    case 'WEBRTC_SEND_DATA':
      webrtcOffscreen.sendResponse(message.data);
      sendResponse({ success: true });
      break;
  }

  return false;
});

console.log('[WebRTC Offscreen] 脚本已加载完成');
