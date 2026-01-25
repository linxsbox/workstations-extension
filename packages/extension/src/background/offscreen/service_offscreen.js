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
  }

  // 生成随机 Peer ID
  generatePeerId() {
    return 'ext-' + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
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

      // 生成一个随机的 Peer ID
      const peerId = this.generatePeerId();
      console.log('[WebRTC Offscreen] 生成 Peer ID:', peerId);

      // 创建 Peer 实例，使用自定义 ID
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

      // 通知 service worker 更新状态
      chrome.runtime.sendMessage({
        type: 'WEBRTC_DISCONNECTED',
        status: 'disconnected'
      }).catch(err => {
        console.error('[WebRTC Offscreen] 发送断开消息失败:', err);
      });
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

    switch (data.type) {
      case 'NOTE':
        await this.saveNote(data);
        this.sendResponse({
          type: 'SUCCESS',
          message: '笔记已保存',
          timestamp: Date.now()
        });
        break;

      case 'PING':
        this.sendResponse({
          type: 'PONG',
          timestamp: Date.now()
        });
        break;

      default:
        console.warn('[WebRTC Offscreen] 未知的数据类型:', data.type);
    }
  }

  async saveNote(data) {
    // 通过消息通知 service worker 保存笔记
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'WEBRTC_SAVE_NOTE',
        note: {
          content: data.content,
          timestamp: data.timestamp || Date.now(),
          source: 'mobile',
          synced: true
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[WebRTC Offscreen] 保存笔记失败:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('[WebRTC Offscreen] 笔记已保存');
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
}

// 创建实例并初始化
console.log('[WebRTC Offscreen] 准备创建实例...');
const webrtcOffscreen = new WebRTCOffscreen();
console.log('[WebRTC Offscreen] 实例已创建，准备初始化...');

webrtcOffscreen.init().then((result) => {
  console.log('[WebRTC Offscreen] 初始化完成，结果:', result);
}).catch((error) => {
  console.error('[WebRTC Offscreen] 初始化失败:', error);
});

console.log('[WebRTC Offscreen] 脚本已加载完成');
